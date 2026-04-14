import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheck2, ClipboardCheck, FileWarning, Plus, Repeat2 } from "lucide-react";
import {
  type FrontdeskBookingRecord,
  type RoomRecord,
  type WalkInDraftQueueRecord,
} from "@/lib/supabase";
import { cn } from "@/lib/utils";

const draftBadge: Record<WalkInDraftQueueRecord["status"], string> = {
  draft: "bg-slate-100 text-slate-800 border-slate-200",
  room_held: "bg-sky-100 text-sky-800 border-sky-200",
  docs_pending: "bg-amber-100 text-amber-900 border-amber-200",
  ready: "bg-emerald-100 text-emerald-800 border-emerald-200",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-rose-100 text-rose-800 border-rose-200",
  expired: "bg-rose-100 text-rose-800 border-rose-200",
};

const bookingBadge: Record<FrontdeskBookingRecord["status"], string> = {
  confirmed: "bg-sky-100 text-sky-800 border-sky-200",
  checked_in: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

function draftRoomLabel(draft: WalkInDraftQueueRecord, rooms: RoomRecord[]) {
  const room = rooms.find((item) => item.id === draft.assigned_room_id);
  return draft.room_number ?? room?.room_number ?? "Room not assigned";
}

function guestLabel(draft: WalkInDraftQueueRecord) {
  return draft.primary_guest_name || "Walk-in guest";
}

interface Props {
  drafts: WalkInDraftQueueRecord[];
  bookings: FrontdeskBookingRecord[];
  rooms: RoomRecord[];
  onNewWalkIn: () => void;
  onResumeDraft: (draftId: string, step?: "guest" | "room" | "documents" | "confirm") => void;
  onTakeOverDraft: (draftId: string) => void;
}

export function CheckInsPanel({ drafts, bookings, rooms, onNewWalkIn, onResumeDraft, onTakeOverDraft }: Props) {
  const actionableDrafts = drafts.filter((draft) => ["draft", "room_held", "docs_pending", "ready"].includes(draft.status));
  const readyDrafts = actionableDrafts.filter((draft) => draft.status === "ready");
  const inProgressDrafts = actionableDrafts.filter((draft) => draft.status !== "ready");
  const confirmedBookings = bookings.filter((booking) => booking.status === "confirmed");
  const checkedInBookings = bookings.filter((booking) => booking.status === "checked_in");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Front-desk walk-ins</h2>
          <p className="text-sm text-muted-foreground">
            Start a walk-in, hold a room, collect ID documents, and only then complete check-in.
          </p>
        </div>
        <Button type="button" onClick={onNewWalkIn}>
          <Plus className="mr-2 h-4 w-4" />
          New walk-in
        </Button>
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <CalendarCheck2 className="h-4 w-4 text-emerald-600" />
          <h3 className="font-medium">Ready to check in</h3>
        </div>
        {readyDrafts.length === 0 && confirmedBookings.length === 0 ? (
          <EmptyState copy="No ready walk-ins or confirmed arrivals right now." />
        ) : (
          <div className="space-y-3">
            {readyDrafts.map((draft) => (
              <Card key={draft.id} className="border-border/60 shadow-sm">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{draft.draft_code}</span>
                      <Badge variant="outline" className={cn("text-[10px] font-semibold uppercase", draftBadge[draft.status])}>
                        {draft.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-base font-semibold text-foreground">{guestLabel(draft)}</p>
                    <p className="text-sm text-muted-foreground">
                      {(draft.guest_category ?? "foreign").replace("_", " ")} guest · Room {draftRoomLabel(draft, rooms)}
                    </p>
                    <p className="text-xs text-muted-foreground">Documents: {draft.document_status}</p>
                  </div>
                  {draft.is_owner ? (
                    <div className="flex shrink-0 gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => onResumeDraft(draft.id, "documents")}>
                        <ClipboardCheck className="mr-1.5 h-3.5 w-3.5" />
                        Verify
                      </Button>
                      <Button type="button" size="sm" onClick={() => onResumeDraft(draft.id, "confirm")}>
                        Confirm
                      </Button>
                    </div>
                  ) : (
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <Badge variant="outline">Assigned to {draft.assigned_operator_name ?? "another receptionist"}</Badge>
                      {draft.can_take_over ? (
                        <Button type="button" variant="outline" size="sm" onClick={() => onTakeOverDraft(draft.id)}>
                          <Repeat2 className="mr-1.5 h-3.5 w-3.5" />
                          Take over
                        </Button>
                      ) : null}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {confirmedBookings.map((booking) => (
              <Card key={booking.id} className="border-border/60 shadow-sm">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{booking.booking_code ?? booking.id}</span>
                      <Badge variant="outline" className={cn("text-[10px] font-semibold uppercase", bookingBadge[booking.status])}>
                        {booking.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-base font-semibold text-foreground">
                      {[booking.guest?.first_name, booking.guest?.last_name].filter(Boolean).join(" ") || "Booked guest"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Existing booking · Room {booking.room?.room_number ?? "Unassigned"}
                    </p>
                  </div>
                  <Badge variant="outline">Existing booking</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <FileWarning className="h-4 w-4 text-amber-600" />
          <h3 className="font-medium">Draft walk-ins</h3>
        </div>
        {inProgressDrafts.length === 0 ? (
          <EmptyState copy="No incomplete walk-ins. Start a new one when a guest arrives." />
        ) : (
          <div className="space-y-3">
            {inProgressDrafts.map((draft) => (
              <Card key={draft.id} className="border-border/60 shadow-sm">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{draft.draft_code}</span>
                      <Badge variant="outline" className={cn("text-[10px] font-semibold uppercase", draftBadge[draft.status])}>
                        {draft.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-base font-semibold text-foreground">{guestLabel(draft)}</p>
                    <p className="text-sm text-muted-foreground">
                      {(draft.guest_category ?? "foreign").replace("_", " ")} guest · Room {draftRoomLabel(draft, rooms)}
                    </p>
                    <p className="text-xs text-muted-foreground">Documents: {draft.document_status}</p>
                  </div>
                  {draft.is_owner ? (
                    <div className="flex shrink-0 gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => onResumeDraft(draft.id, draft.status === "draft" ? "guest" : draft.status === "room_held" ? "documents" : "documents")}>
                        Resume
                      </Button>
                    </div>
                  ) : (
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <Badge variant="outline">Assigned to {draft.assigned_operator_name ?? "another receptionist"}</Badge>
                      {draft.can_take_over ? (
                        <Button type="button" variant="outline" size="sm" onClick={() => onTakeOverDraft(draft.id)}>
                          <Repeat2 className="mr-1.5 h-3.5 w-3.5" />
                          Take over
                        </Button>
                      ) : null}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-sky-600" />
          <h3 className="font-medium">Checked in today</h3>
        </div>
        {checkedInBookings.length === 0 ? (
          <EmptyState copy="No completed front-desk check-ins yet today." />
        ) : (
          <div className="space-y-3">
            {checkedInBookings.map((booking) => (
              <Card key={booking.id} className="border-border/60 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">
                    {[booking.guest?.first_name, booking.guest?.last_name].filter(Boolean).join(" ") || "Checked-in guest"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-sm text-muted-foreground">
                  {booking.booking_code ?? booking.id} · Room {booking.room?.room_number ?? "Unknown"} · {booking.guest?.nationality ?? "Nationality pending"}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyState({ copy }: { copy: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
      {copy}
    </div>
  );
}
