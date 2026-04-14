import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  cancelWalkInDraft,
  createSignedGuestDocumentUrl,
  createWalkInDraft,
  deleteGuestDocument,
  finalizeWalkInCheckIn,
  holdRoomForWalkIn,
  listGuestDocumentsForDraft,
  preflightWalkInCheckIn,
  releaseWalkInRoomHold,
  searchFrontdeskGuestMatches,
  updateWalkInDraft,
  uploadGuestDocumentForDraft,
  type FrontdeskGuestSearchResult,
  type GuestDocumentRecord,
  type HotelRecord,
  type RoomHoldRecord,
  type RoomRecord,
  type WalkInCompanionPayload,
  type WalkInDraftGuestPayload,
  type WalkInDraftRecord,
  type WalkInPreflightResult,
} from "@/lib/supabase";
import { cn } from "@/lib/utils";

type WalkInStep = "guest" | "room" | "documents" | "confirm";

const STEP_ORDER: WalkInStep[] = ["guest", "room", "documents", "confirm"];
const DOCUMENT_OPTIONS = [
  { value: "passport", label: "Passport" },
  { value: "visa", label: "Visa" },
  { value: "government_id", label: "Government ID" },
  { value: "address_proof", label: "Address proof" },
];

function nextDate(days = 1) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

function newTempKey() {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `cmp-${Date.now()}`;
}

function requiredDocumentTypes(guest: WalkInDraftGuestPayload) {
  const category = guest.guest_category ?? guest.guestCategory ?? "foreign";
  if (category === "domestic") return ["government_id"];
  const required = ["passport"];
  const needsVisa =
    guest.visa_required === true ||
    Boolean((guest.visa_type ?? "").trim()) ||
    Boolean((guest.visa_expiry_date ?? "").trim());
  if (needsVisa) required.push("visa");
  return required;
}

function fullName(guest: WalkInDraftGuestPayload) {
  return [guest.first_name, guest.last_name].filter(Boolean).join(" ").trim();
}

function holdForDraft(holds: RoomHoldRecord[], draftId: string | null) {
  if (!draftId) return null;
  const now = Date.now();
  return (
    holds.find((hold) => hold.draft_id === draftId && hold.status === "active" && new Date(hold.expires_at).getTime() > now) ??
    null
  );
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotel: HotelRecord;
  userId: string;
  rooms: RoomRecord[];
  holds: RoomHoldRecord[];
  existingDraft: WalkInDraftRecord | null;
  initialRoomId?: string | null;
  initialStep?: WalkInStep;
  onCompleted: () => Promise<void> | void;
}

export function WalkInCheckInSheet({
  open,
  onOpenChange,
  hotel,
  userId,
  rooms,
  holds,
  existingDraft,
  initialRoomId,
  initialStep = "guest",
  onCompleted,
}: Props) {
  const [currentStep, setCurrentStep] = useState<WalkInStep>(initialStep);
  const [draft, setDraft] = useState<WalkInDraftRecord | null>(existingDraft);
  const [documents, setDocuments] = useState<GuestDocumentRecord[]>([]);
  const [guest, setGuest] = useState<WalkInDraftGuestPayload>(existingDraft?.guest_payload ?? { guest_category: "foreign" });
  const [companions, setCompanions] = useState<WalkInCompanionPayload[]>(existingDraft?.companions_payload ?? []);
  const [checkOutDate, setCheckOutDate] = useState(existingDraft?.check_out_date ?? nextDate(1));
  const [searchQuery, setSearchQuery] = useState("");
  const [matches, setMatches] = useState<FrontdeskGuestSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [preflight, setPreflight] = useState<WalkInPreflightResult | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!open) return;
    setCurrentStep(initialStep);
  }, [initialStep, open]);

  useEffect(() => {
    if (!open) return;
    setDraft(existingDraft);
    setGuest(existingDraft?.guest_payload ?? { guest_category: "foreign" });
    setCompanions(existingDraft?.companions_payload ?? []);
    setCheckOutDate(existingDraft?.check_out_date ?? nextDate(1));
    setPreflight(null);
  }, [existingDraft, open]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => {
      window.clearInterval(timer);
    };
  }, [open]);

  const refreshDocuments = useCallback(async (draftId: string) => {
    const result = await listGuestDocumentsForDraft(draftId);
    if (result.error) {
      toast.error(result.error.message || "Failed to load guest documents");
      return;
    }
    setDocuments(result.data);
  }, []);

  useEffect(() => {
    if (!open || !draft?.id) {
      setDocuments([]);
      return;
    }
    void refreshDocuments(draft.id);
  }, [draft?.id, open, refreshDocuments]);

  useEffect(() => {
    if (!open) return;
    if (draft || existingDraft) return;

    let active = true;
    const create = async () => {
      setBusyAction("create");
      const result = await createWalkInDraft(hotel.id, userId, checkOutDate);
      setBusyAction(null);
      if (!active) return;
      if (result.error || !result.data) {
        toast.error(result.error?.message || "Unable to start walk-in");
        onOpenChange(false);
        return;
      }
      setDraft(result.data);
      setGuest(result.data.guest_payload);
      setCompanions(result.data.companions_payload);
      setCheckOutDate(result.data.check_out_date);
      if (initialRoomId) {
        const holdResult = await holdRoomForWalkIn(result.data.id, initialRoomId);
        if (holdResult.error) {
          toast.error(holdResult.error.message || "Unable to hold room");
        } else {
          setDraft((prev) =>
            prev
              ? {
                  ...prev,
                  assigned_room_id: initialRoomId,
                  status: "room_held",
                  hold_expires_at: holdResult.data?.hold_expires_at ?? prev.hold_expires_at,
                }
              : prev,
          );
          setCurrentStep("room");
        }
      }
    };

    void create();
    return () => {
      active = false;
    };
  }, [checkOutDate, draft, existingDraft, hotel.id, initialRoomId, onOpenChange, open, userId]);

  useEffect(() => {
    if (!open || !draft?.id) return;
    const timer = window.setTimeout(async () => {
      setSaving(true);
      const result = await updateWalkInDraft(draft.id, {
        guest_payload: guest,
        companions_payload: companions,
        check_out_date: checkOutDate,
      });
      setSaving(false);
      if (result.error || !result.data) {
        toast.error(result.error?.message || "Failed to save walk-in draft");
        return;
      }
      setDraft(result.data);
    }, 500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [checkOutDate, companions, draft?.id, guest, open]);

  useEffect(() => {
    if (!open) {
      setMatches([]);
      setSearchQuery("");
      return;
    }
    const query = searchQuery.trim();
    if (query.length < 3) {
      setMatches([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      setSearching(true);
      const result = await searchFrontdeskGuestMatches(hotel.id, query);
      setSearching(false);
      if (result.error) {
        toast.error(result.error.message || "Guest search failed");
        return;
      }
      setMatches(result.data);
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [open, searchQuery]);

  useEffect(() => {
    if (!open || currentStep !== "confirm" || !draft?.id) return;

    let active = true;
    const runPreflight = async () => {
      const result = await preflightWalkInCheckIn(draft.id);
      if (!active) return;
      if (result.error) {
        toast.error(result.error.message || "Unable to validate walk-in");
        return;
      }
      setPreflight(result.data);
    };

    void runPreflight();
    return () => {
      active = false;
    };
  }, [currentStep, draft?.id, open]);

  const currentHold = useMemo(() => holdForDraft(holds, draft?.id ?? null), [draft?.id, holds]);
  const currentHoldMs = currentHold ? new Date(currentHold.expires_at).getTime() - nowMs : null;
  const currentHoldSeconds = currentHoldMs !== null ? Math.max(0, Math.ceil(currentHoldMs / 1000)) : null;
  const exactMatches = useMemo(() => matches.filter((match) => match.match_type === "exact"), [matches]);
  const similarMatches = useMemo(() => matches.filter((match) => match.match_type !== "exact"), [matches]);
  const requiredDocs = useMemo(() => requiredDocumentTypes(guest), [guest]);
  const uploadedDocTypes = useMemo(() => new Set(documents.map((doc) => doc.document_type)), [documents]);
  const missingRequiredDocs = useMemo(
    () => requiredDocs.filter((docType) => !uploadedDocTypes.has(docType)),
    [requiredDocs, uploadedDocTypes],
  );

  const roomCards = useMemo(
    () =>
      rooms.map((room) => {
        const activeHold =
          holds.find(
            (hold) =>
              hold.room_id === room.id &&
              hold.status === "active" &&
              new Date(hold.expires_at).getTime() > nowMs,
          ) ?? null;
        const heldBySelf = activeHold?.held_by === userId && activeHold.draft_id === draft?.id;
        const effectiveState =
          room.status !== "available"
            ? room.status
            : activeHold
              ? heldBySelf
                ? "held_self"
                : "held_other"
              : "available";
        return { room, activeHold, effectiveState };
      }),
    [draft?.id, holds, nowMs, rooms, userId],
  );

  const canProceedFromRoom = Boolean(currentHold && draft?.assigned_room_id);
  const canProceedFromDocuments = draft?.document_status === "complete";

  useEffect(() => {
    if (!open || !draft?.assigned_room_id) return;
    if (currentHold) return;
    if (currentStep === "guest" || currentStep === "room") return;
    toast.error("Room hold expired. Please select the room again.");
    setCurrentStep("room");
  }, [currentHold, currentStep, draft?.assigned_room_id, open]);

  const updateGuestField = useCallback((key: keyof WalkInDraftGuestPayload, value: string | boolean) => {
    setGuest((prev) => ({ ...prev, [key]: value }));
  }, []);

  const applyGuestMatch = useCallback((match: FrontdeskGuestSearchResult) => {
    const names = match.full_name.trim().split(/\s+/);
    setGuest((prev) => ({
      ...prev,
      first_name: names[0] ?? prev.first_name,
      last_name: names.slice(1).join(" ") || prev.last_name,
      email: match.email ?? prev.email,
      phone: match.phone ?? prev.phone,
      nationality: match.nationality ?? prev.nationality,
      passport_number: match.passport_number ?? prev.passport_number,
      id_type: match.id_type ?? prev.id_type,
      id_number: match.id_number ?? prev.id_number,
    }));
    setSearchQuery("");
    setMatches([]);
  }, []);

  const addCompanion = useCallback(() => {
    setCompanions((prev) => [
      ...prev,
      {
        temp_key: newTempKey(),
        full_name: "",
      },
    ]);
  }, []);

  const updateCompanion = useCallback((tempKey: string, key: keyof WalkInCompanionPayload, value: string) => {
    setCompanions((prev) => prev.map((item) => (item.temp_key === tempKey ? { ...item, [key]: value } : item)));
  }, []);

  const removeCompanion = useCallback((tempKey: string) => {
    setCompanions((prev) => prev.filter((item) => item.temp_key !== tempKey));
  }, []);

  const selectRoom = useCallback(
    async (roomId: string) => {
      if (!draft?.id) return;
      setBusyAction(roomId);
      const result = await holdRoomForWalkIn(draft.id, roomId);
      setBusyAction(null);
      if (result.error || !result.data) {
        toast.error(result.error?.message || "Unable to hold room");
        return;
      }
      setDraft((prev) =>
        prev
          ? {
              ...prev,
              assigned_room_id: roomId,
              hold_expires_at: result.data?.hold_expires_at ?? null,
              status: "room_held",
            }
          : prev,
      );
      toast.success("Room held for check-in");
    },
    [draft?.id],
  );

  const uploadDocument = useCallback(
    async (documentType: string, file: File | null) => {
      if (!file || !draft?.id) return;
      setBusyAction(`upload-${documentType}`);
      const result = await uploadGuestDocumentForDraft({
        hotelId: hotel.id,
        draftId: draft.id,
        subjectKind: "primary_guest",
        documentType,
        file,
        isRequired: requiredDocs.includes(documentType),
        documentNumber:
          documentType === "passport"
            ? guest.passport_number ?? null
            : documentType === "government_id"
              ? guest.id_number ?? null
              : null,
        issuedCountry: documentType === "passport" ? guest.passport_issued_country ?? null : guest.country ?? null,
      });
      setBusyAction(null);
      if (result.error) {
        toast.error(result.error.message || "Upload failed");
        return;
      }
      toast.success(`${documentType.replace("_", " ")} uploaded`);
      await refreshDocuments(draft.id);
      const updated = await preflightWalkInCheckIn(draft.id);
      if (!updated.error) {
        setPreflight(updated.data);
        setDraft((prev) =>
          prev && updated.data
            ? {
                ...prev,
                document_status: updated.data.document_status,
                hold_expires_at: updated.data.hold_expires_at ?? prev.hold_expires_at,
                status: updated.data.document_status === "complete" && prev.assigned_room_id ? "ready" : prev.status,
              }
            : prev,
        );
      }
    },
    [draft?.id, guest.country, guest.id_number, guest.passport_issued_country, guest.passport_number, hotel.id, refreshDocuments, requiredDocs],
  );

  const removeDocument = useCallback(
    async (document: GuestDocumentRecord) => {
      setBusyAction(`remove-${document.id}`);
      const result = await deleteGuestDocument(document.id, document.storage_path, draft?.id);
      setBusyAction(null);
      if (result.error) {
        toast.error(result.error.message || "Failed to remove document");
        return;
      }
      if (draft?.id) {
        await refreshDocuments(draft.id);
        const updated = await preflightWalkInCheckIn(draft.id);
        if (!updated.error) {
          setPreflight(updated.data);
          setDraft((prev) =>
            prev && updated.data
              ? {
                  ...prev,
                  document_status: updated.data.document_status,
                  hold_expires_at: updated.data.hold_expires_at ?? prev.hold_expires_at,
                }
              : prev,
          );
        }
      }
    },
    [draft?.id, refreshDocuments],
  );

  const previewDocument = useCallback(async (document: GuestDocumentRecord) => {
    setBusyAction(`preview-${document.id}`);
    const result = await createSignedGuestDocumentUrl(document.storage_path, 300);
    setBusyAction(null);
    if (result.error || !result.data) {
      toast.error(result.error?.message || "Unable to open document preview");
      return;
    }
    window.open(result.data, "_blank", "noopener,noreferrer");
  }, []);

  const releaseRoom = useCallback(async () => {
    if (!draft?.id) return;
    setBusyAction("release-room");
    const result = await releaseWalkInRoomHold(draft.id);
    setBusyAction(null);
    if (result.error) {
      toast.error(result.error.message || "Unable to release room");
      return;
    }
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            assigned_room_id: null,
            hold_expires_at: null,
            status: "draft",
          }
        : prev,
    );
    setCurrentStep("room");
    await onCompleted();
    toast.success("Room released");
  }, [draft?.id, onCompleted]);

  const runFinalize = useCallback(async () => {
    if (!draft?.id) return;
    setBusyAction("finalize");
    const result = await finalizeWalkInCheckIn(draft.id);
    setBusyAction(null);
    if (result.error || !result.data) {
      toast.error(result.error?.message || "Unable to complete walk-in");
      const refreshed = await preflightWalkInCheckIn(draft.id);
      if (!refreshed.error) {
        setPreflight(refreshed.data);
        if (refreshed.data && !refreshed.data.can_finalize) {
          if (refreshed.data.blockers.some((item) => item.toLowerCase().includes("document"))) {
            setCurrentStep("documents");
          } else {
            setCurrentStep("room");
          }
        }
      }
      return;
    }
    toast.success(`Checked in ${fullName(guest) || "guest"} to room ${result.data.room_number}`);
    await onCompleted();
    onOpenChange(false);
  }, [draft?.id, guest, onCompleted, onOpenChange]);

  const cancelDraft = useCallback(async () => {
    if (!draft?.id) {
      onOpenChange(false);
      return;
    }
    setBusyAction("cancel");
    const result = await cancelWalkInDraft(draft.id);
    setBusyAction(null);
    if (result.error) {
      toast.error(result.error.message || "Unable to cancel walk-in");
      return;
    }
    toast.success("Walk-in draft cancelled");
    await onCompleted();
    onOpenChange(false);
  }, [draft?.id, onCompleted, onOpenChange]);

  const closeSheet = useCallback(
    async (nextOpen: boolean) => {
      if (nextOpen) {
        onOpenChange(true);
        return;
      }
      onOpenChange(false);
      await onCompleted();
    },
    [onCompleted, onOpenChange],
  );

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => void closeSheet(nextOpen)}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle>Walk-in check-in</SheetTitle>
          <SheetDescription>
            Front-desk flow for manager and receptionist operations at {hotel.name}.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="grid gap-2 sm:grid-cols-4">
            {STEP_ORDER.map((step, index) => (
              <button
                key={step}
                type="button"
                className={cn(
                  "rounded-xl border px-3 py-2 text-left text-sm",
                  currentStep === step ? "border-primary bg-primary/5 text-primary" : "border-border/60 text-muted-foreground",
                )}
                onClick={() => setCurrentStep(step)}
              >
                <div className="text-xs uppercase tracking-wide">Step {index + 1}</div>
                <div className="font-medium capitalize">{step}</div>
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-medium">Property: {hotel.name}</span>
              {draft ? <Badge variant="outline">{draft.draft_code}</Badge> : null}
              {saving ? <span className="text-muted-foreground">Saving draft…</span> : null}
              {currentHold ? (
                <span className="text-amber-700">
                  Room hold active until {new Date(currentHold.expires_at).toLocaleTimeString()}
                </span>
              ) : null}
              {currentHoldSeconds !== null ? (
                <Badge variant="outline">{currentHoldSeconds}s left</Badge>
              ) : null}
            </div>
            {currentHoldSeconds !== null && currentHoldSeconds <= 60 ? (
              <p className="mt-2 text-xs text-amber-700">
                This hold is about to expire. Complete the remaining steps or release and reselect the room.
              </p>
            ) : null}
            {!currentHold && draft?.assigned_room_id ? (
              <p className="mt-2 text-xs text-rose-700">
                The previous room hold has expired. Your guest and document details are still saved.
              </p>
            ) : null}
          </div>

          {currentStep === "guest" ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="guest-search">Duplicate search</Label>
                <Input
                  id="guest-search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by phone, email, passport, or ID"
                />
                {searching ? <p className="text-xs text-muted-foreground">Searching guests…</p> : null}
                {matches.length > 0 ? (
                  <div className="space-y-3 rounded-xl border border-border/60 p-3">
                    {exactMatches.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Exact matches in this hotel</p>
                        {exactMatches.map((match) => (
                          <button
                            key={match.guest_id}
                            type="button"
                            className="w-full rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-left text-sm hover:bg-emerald-100/80"
                            onClick={() => applyGuestMatch(match)}
                          >
                            <div className="font-medium">{match.full_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {match.phone || match.email || "No phone/email"} · {match.passport_number || match.id_number || "No document"}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : null}
                    {similarMatches.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Similar past guests in this hotel</p>
                        {similarMatches.map((match) => (
                          <button
                            key={match.guest_id}
                            type="button"
                            className="w-full rounded-lg border border-border/60 px-3 py-2 text-left text-sm hover:bg-muted/60"
                            onClick={() => applyGuestMatch(match)}
                          >
                            <div className="font-medium">{match.full_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {match.phone || match.email || "No phone/email"} · {match.passport_number || match.id_number || "No document"}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Guest category</Label>
                  <Select
                    value={guest.guest_category ?? guest.guestCategory ?? "foreign"}
                    onValueChange={(value) => updateGuestField("guest_category", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select guest category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="foreign">Foreign</SelectItem>
                      <SelectItem value="domestic">Domestic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkout-date">Expected check-out</Label>
                  <Input
                    id="checkout-date"
                    type="date"
                    value={checkOutDate}
                    onChange={(event) => setCheckOutDate(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="first-name">First name</Label>
                  <Input id="first-name" value={guest.first_name ?? ""} onChange={(event) => updateGuestField("first_name", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last name</Label>
                  <Input id="last-name" value={guest.last_name ?? ""} onChange={(event) => updateGuestField("last_name", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input id="nationality" value={guest.nationality ?? ""} onChange={(event) => updateGuestField("nationality", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Preferred language</Label>
                  <Input id="language" value={guest.preferred_language ?? ""} onChange={(event) => updateGuestField("preferred_language", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone / WhatsApp</Label>
                  <Input id="phone" value={guest.phone ?? ""} onChange={(event) => updateGuestField("phone", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={guest.email ?? ""} onChange={(event) => updateGuestField("email", event.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address-line1">Address</Label>
                  <Input
                    id="address-line1"
                    value={guest.address_line1 ?? ""}
                    onChange={(event) => updateGuestField("address_line1", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={guest.city ?? ""} onChange={(event) => updateGuestField("city", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" value={guest.country ?? ""} onChange={(event) => updateGuestField("country", event.target.value)} />
                </div>
              </div>

              {(guest.guest_category ?? guest.guestCategory ?? "foreign") === "foreign" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="passport-number">Passport number</Label>
                    <Input
                      id="passport-number"
                      value={guest.passport_number ?? ""}
                      onChange={(event) => updateGuestField("passport_number", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passport-expiry">Passport expiry</Label>
                    <Input
                      id="passport-expiry"
                      type="date"
                      value={guest.passport_expiry_date ?? ""}
                      onChange={(event) => updateGuestField("passport_expiry_date", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visa-type">Visa type</Label>
                    <Input id="visa-type" value={guest.visa_type ?? ""} onChange={(event) => updateGuestField("visa_type", event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visa-expiry">Visa expiry</Label>
                    <Input
                      id="visa-expiry"
                      type="date"
                      value={guest.visa_expiry_date ?? ""}
                      onChange={(event) => updateGuestField("visa_expiry_date", event.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="id-type">ID type</Label>
                    <Input id="id-type" value={guest.id_type ?? ""} onChange={(event) => updateGuestField("id_type", event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="id-number">ID number</Label>
                    <Input id="id-number" value={guest.id_number ?? ""} onChange={(event) => updateGuestField("id_number", event.target.value)} />
                  </div>
                </div>
              )}

              <div className="space-y-3 rounded-xl border border-border/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Companions</h3>
                    <p className="text-xs text-muted-foreground">Keep companion details in the same walk-in draft.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addCompanion}>
                    Add companion
                  </Button>
                </div>
                <div className="space-y-3">
                  {companions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No companions added yet.</p>
                  ) : (
                    companions.map((companion) => (
                      <div key={companion.temp_key} className="grid gap-3 rounded-lg border border-border/60 p-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input
                            value={companion.full_name}
                            onChange={(event) => updateCompanion(companion.temp_key, "full_name", event.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Relationship</Label>
                          <Input
                            value={companion.relationship ?? ""}
                            onChange={(event) => updateCompanion(companion.temp_key, "relationship", event.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Nationality</Label>
                          <Input
                            value={companion.nationality ?? ""}
                            onChange={(event) => updateCompanion(companion.temp_key, "nationality", event.target.value)}
                          />
                        </div>
                        <div className="flex items-end justify-end">
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeCompanion(companion.temp_key)}>
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="walkin-notes">Front-desk notes</Label>
                <Textarea id="walkin-notes" value={guest.notes ?? ""} onChange={(event) => updateGuestField("notes", event.target.value)} />
              </div>
            </div>
          ) : null}

          {currentStep === "room" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Assign room</h3>
                  <p className="text-sm text-muted-foreground">Only available rooms can be held for this walk-in.</p>
                </div>
                <div className="flex items-center gap-2">
                  {currentHold ? <Badge variant="outline">Hold active</Badge> : null}
                  {currentHold ? (
                    <Button type="button" variant="outline" size="sm" disabled={busyAction === "release-room"} onClick={() => void releaseRoom()}>
                      Release room
                    </Button>
                  ) : null}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {roomCards.map(({ room, activeHold, effectiveState }) => (
                  <button
                    key={room.id}
                    type="button"
                    disabled={
                      effectiveState === "occupied" ||
                      effectiveState === "maintenance" ||
                      effectiveState === "cleaning" ||
                      effectiveState === "held_other"
                    }
                    onClick={() => void selectRoom(room.id)}
                    className={cn(
                      "rounded-xl border p-4 text-left transition-colors",
                      effectiveState === "available" && "border-emerald-200 bg-emerald-50 hover:bg-emerald-100/80",
                      effectiveState === "held_self" && "border-sky-200 bg-sky-50",
                      effectiveState === "held_other" && "border-amber-200 bg-amber-50 opacity-70",
                      effectiveState === "occupied" && "border-rose-200 bg-rose-50 opacity-70",
                      effectiveState === "cleaning" && "border-amber-300 bg-amber-100/70 opacity-70",
                      effectiveState === "maintenance" && "border-slate-300 bg-slate-100 opacity-70",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-semibold">Room {room.room_number}</div>
                      <Badge variant="outline">{effectiveState.replace("_", " ")}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {activeHold && effectiveState === "held_other"
                        ? `Held by another receptionist until ${new Date(activeHold.expires_at).toLocaleTimeString()}`
                        : room.status}
                    </p>
                    {busyAction === room.id ? <p className="mt-2 text-xs text-muted-foreground">Holding room…</p> : null}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {currentStep === "documents" ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Required documents</h3>
                <p className="text-sm text-muted-foreground">
                  Final check-in is blocked until all required identity documents are uploaded.
                </p>
              </div>
              <div className="space-y-3">
                {DOCUMENT_OPTIONS.map((option) => {
                  const docRows = documents.filter((item) => item.document_type === option.value);
                  const isRequired = requiredDocs.includes(option.value);
                  return (
                    <div key={option.value} className="rounded-xl border border-border/60 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{option.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {isRequired ? "Required for this guest" : "Optional"}
                          </p>
                        </div>
                        <Badge variant="outline">{docRows.length > 0 ? "Uploaded" : isRequired ? "Missing" : "Optional"}</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <Input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,.pdf"
                          className="max-w-sm"
                          onChange={(event) => {
                            const file = event.target.files?.[0] ?? null;
                            void uploadDocument(option.value, file);
                            event.target.value = "";
                          }}
                        />
                        {busyAction === `upload-${option.value}` ? <span className="text-xs text-muted-foreground">Uploading…</span> : null}
                      </div>
                      {docRows.length > 0 ? (
                        <div className="mt-3 space-y-2">
                          {docRows.map((document) => (
                            <div key={document.id} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm">
                              <div className="min-w-0">
                                <p className="truncate font-medium">{document.file_name}</p>
                                <p className="text-xs text-muted-foreground">{Math.round(document.file_size / 1024)} KB</p>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={busyAction === `preview-${document.id}`}
                                onClick={() => void previewDocument(document)}
                              >
                                Preview
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={busyAction === `remove-${document.id}`}
                                onClick={() => void removeDocument(document)}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              {missingRequiredDocs.length > 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  Missing required documents: {missingRequiredDocs.map((item) => item.replace("_", " ")).join(", ")}.
                </div>
              ) : null}
            </div>
          ) : null}

          {currentStep === "confirm" ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-border/60 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="outline">Guest: {fullName(guest) || "Pending guest name"}</Badge>
                  <Badge variant="outline">Room: {rooms.find((room) => room.id === draft?.assigned_room_id)?.room_number ?? "Not assigned"}</Badge>
                  <Badge variant="outline">Docs: {draft?.document_status ?? "missing"}</Badge>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Review the final preflight below. The confirm action stays blocked until the server says the room, hold, and documents are all valid.
                </p>
              </div>

              {preflight ? (
                <div className="space-y-3">
                  <div className={cn("rounded-xl border p-4 text-sm", preflight.can_finalize ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50")}>
                    <p className="font-medium">{preflight.can_finalize ? "Ready to finalize" : "Action required before final check-in"}</p>
                    <p className="mt-1 text-muted-foreground">
                      Effective room state: {preflight.effective_room_state.replace("_", " ")}.
                    </p>
                    {preflight.hold_expires_at ? (
                      <p className="mt-1 text-muted-foreground">
                        Hold expires at {new Date(preflight.hold_expires_at).toLocaleTimeString()}.
                      </p>
                    ) : null}
                  </div>
                  {preflight.blockers.length > 0 ? (
                    <div className="rounded-xl border border-border/60 p-4">
                      <p className="mb-2 text-sm font-medium">Server blockers</p>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        {preflight.blockers.map((blocker) => (
                          <li key={blocker}>{blocker}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Running server preflight…</p>
              )}
            </div>
          ) : null}
        </div>
        <SheetFooter className="mt-8">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => void cancelDraft()} disabled={busyAction === "cancel"}>
                Cancel draft
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={STEP_ORDER.indexOf(currentStep) === 0}
                onClick={() => setCurrentStep(STEP_ORDER[Math.max(0, STEP_ORDER.indexOf(currentStep) - 1)])}
              >
                Back
              </Button>
              {currentStep !== "confirm" ? (
                <Button
                  type="button"
                  disabled={
                    busyAction !== null ||
                    (currentStep === "room" && !canProceedFromRoom) ||
                    (currentStep === "documents" && !canProceedFromDocuments)
                  }
                  onClick={() => setCurrentStep(STEP_ORDER[Math.min(STEP_ORDER.length - 1, STEP_ORDER.indexOf(currentStep) + 1)])}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={busyAction === "finalize" || !preflight?.can_finalize}
                  onClick={() => void runFinalize()}
                >
                  Confirm check-in
                </Button>
              )}
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
