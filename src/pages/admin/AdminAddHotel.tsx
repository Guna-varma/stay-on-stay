import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  createHotelOnly,
  isSupabaseConfigured,
  listProfilesForAdmin,
  listAmenities,
  createAmenity,
  type Profile,
  type AmenityRecord,
} from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Loader2,
  MapPin,
  Plus,
  Trash2,
} from "lucide-react";

interface LandmarkForm {
  name: string;
  googleMapsUrl: string;
}

export default function AdminAddHotel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const hasSupabase = isSupabaseConfigured();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 – Hotel info
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [description, setDescription] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [coverFiles, setCoverFiles] = useState<File[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  // Step 2 – Amenities
  const [allAmenities, setAllAmenities] = useState<AmenityRecord[]>([]);
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<Set<string>>(new Set());
  const [newAmenityName, setNewAmenityName] = useState("");
  const [addingAmenity, setAddingAmenity] = useState(false);

  // Step 3 – Landmarks
  const [landmarks, setLandmarks] = useState<LandmarkForm[]>([]);

  useEffect(() => {
    if (!hasSupabase || user?.role !== "admin") return;
    listProfilesForAdmin().then(({ data, error }) => {
      if (!error && data) setProfiles(data);
    });
    listAmenities().then(({ data }) => {
      if (data) setAllAmenities(data);
    });
  }, [hasSupabase, user?.role]);

  const filteredOwners = profiles.filter(
    (p) =>
      p.role === "owner" &&
      p.is_active &&
      (p.email ?? "").toLowerCase().includes(ownerEmail.trim().toLowerCase())
  );

  const toggleAmenity = (id: string) => {
    setSelectedAmenityIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddAmenity = async () => {
    const trimmed = newAmenityName.trim();
    if (!trimmed) return;
    setAddingAmenity(true);
    const { data, error } = await createAmenity(trimmed);
    setAddingAmenity(false);
    if (error) {
      toast({ title: "Could not add amenity", description: error.message, variant: "destructive" });
      return;
    }
    if (data) {
      setAllAmenities((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedAmenityIds((prev) => new Set(prev).add(data.id));
      setNewAmenityName("");
    }
  };

  const addLandmark = () => setLandmarks((prev) => [...prev, { name: "", googleMapsUrl: "" }]);
  const removeLandmark = (idx: number) => setLandmarks((prev) => prev.filter((_, i) => i !== idx));
  const updateLandmark = (idx: number, field: keyof LandmarkForm, value: string) =>
    setLandmarks((prev) => prev.map((lm, i) => (i === idx ? { ...lm, [field]: value } : lm)));

  const validate = (): string | null => {
    if (!name.trim()) return "Hotel name is required.";
    if (!ownerId) return "Select an owner by email (must be role owner).";
    if (coverFiles.length < 1) return "At least one cover photo is required (up to 3).";
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      toast({ title: "Validation", description: err, variant: "destructive" });
      return;
    }
    if (!ownerId || coverFiles.length < 1) return;

    setSubmitting(true);
    const validLandmarks = landmarks.filter((lm) => lm.name.trim());
    const { data: hotel, error } = await createHotelOnly(ownerId, {
      name: name.trim(),
      description: description.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      country: country.trim() || undefined,
      imageFiles: coverFiles,
      amenityIds: Array.from(selectedAmenityIds),
      landmarks: validLandmarks,
    });
    setSubmitting(false);
    if (error || !hotel) {
      toast({ title: "Could not create hotel", description: error?.message ?? "Unknown error", variant: "destructive" });
      return;
    }
    toast({ title: "Hotel created", description: "Now add rooms to this hotel." });
    navigate(`/hotels-mgmt/${hotel.id}/rooms/new`, { replace: true });
  };

  if (!hasSupabase || user?.role !== "admin") {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Admin access required.{" "}
        <Link to="/dashboard" className="text-primary underline">Back</Link>
      </div>
    );
  }

  const totalSteps = 4;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/hotels-mgmt"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-heading font-bold">Add hotel</h1>
          <p className="text-sm text-muted-foreground">Step {step} of {totalSteps}</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex gap-1">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* ── Step 1: Hotel Info ── */}
      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>Hotel information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Hotel name" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Address</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div>
                <Label>City</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Country</Label>
              <Input value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div>
              <Label>Owner (search by email) *</Label>
              <Input
                value={ownerEmail}
                onChange={(e) => { setOwnerEmail(e.target.value); setOwnerId(null); }}
                placeholder="owner@example.com"
              />
              {ownerEmail.trim().length > 1 && (
                <ul className="mt-2 border rounded-md divide-y max-h-40 overflow-auto text-sm">
                  {filteredOwners.length === 0 ? (
                    <li className="p-2 text-muted-foreground">No owner profiles match.</li>
                  ) : (
                    filteredOwners.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          className={`w-full text-left p-2 hover:bg-muted ${ownerId === p.id ? "bg-muted" : ""}`}
                          onClick={() => { setOwnerId(p.id); setOwnerEmail(p.email ?? ""); }}
                        >
                          {p.email} <span className="text-xs text-muted-foreground">({p.role})</span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
              {ownerId && <p className="text-xs text-muted-foreground mt-1">Selected: {ownerId}</p>}
            </div>
            <div>
              <Label>Cover photos * (1–3)</Label>
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) => {
                  const list = e.target.files ? Array.from(e.target.files).slice(0, 3) : [];
                  setCoverFiles(list);
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Up to 3 images; each compressed to ~100KB (WebP preferred). They auto-rotate on the hotel page every 3 seconds.
              </p>
              {coverFiles.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">{coverFiles.length} file(s) selected</p>
              )}
            </div>
            <Button onClick={() => setStep(2)}>Next — Amenities</Button>
          </CardContent>
        </Card>
      )}

      {/* ── Step 2: Amenities ── */}
      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>Amenities</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Select amenities offered by this hotel.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {allAmenities.map((a) => (
                <label
                  key={a.id}
                  className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors text-sm ${
                    selectedAmenityIds.has(a.id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                      selectedAmenityIds.has(a.id)
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    {selectedAmenityIds.has(a.id) && <Check className="h-3 w-3" />}
                  </div>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={selectedAmenityIds.has(a.id)}
                    onChange={() => toggleAmenity(a.id)}
                  />
                  <span>{a.name}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label>Add new amenity</Label>
                <Input
                  value={newAmenityName}
                  onChange={(e) => setNewAmenityName(e.target.value)}
                  placeholder="e.g. Rooftop Lounge"
                  onKeyDown={(e) => e.key === "Enter" && handleAddAmenity()}
                />
              </div>
              <Button variant="outline" onClick={handleAddAmenity} disabled={addingAmenity || !newAmenityName.trim()}>
                {addingAmenity ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">{selectedAmenityIds.size} amenities selected</p>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)}>Next — Landmarks</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 3: Landmarks ── */}
      {step === 3 && (
        <Card>
          <CardHeader><CardTitle>Nearby landmarks</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Add nearby places so guests can orient themselves.</p>
            {landmarks.map((lm, idx) => (
              <div key={idx} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> Landmark {idx + 1}
                  </span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeLandmark(idx)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <Label>Name</Label>
                  <Input
                    value={lm.name}
                    onChange={(e) => updateLandmark(idx, "name", e.target.value)}
                    placeholder="e.g. Central Railway Station"
                  />
                </div>
                <div>
                  <Label>Google Maps URL</Label>
                  <Input
                    value={lm.googleMapsUrl}
                    onChange={(e) => updateLandmark(idx, "googleMapsUrl", e.target.value)}
                    placeholder="https://maps.google.com/..."
                  />
                </div>
                {lm.googleMapsUrl.trim() && (
                  <a
                    href={lm.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" /> Open in Google Maps
                  </a>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addLandmark}>
              <Plus className="h-4 w-4 mr-2" /> Add landmark
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={() => setStep(4)}>Review</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 4: Review ── */}
      {step === 4 && (
        <Card>
          <CardHeader><CardTitle>Review & create</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="space-y-1">
              <p className="font-semibold text-base">{name}</p>
              <p className="text-muted-foreground">{[address, city, country].filter(Boolean).join(", ") || "—"}</p>
              {description && <p className="text-muted-foreground">{description}</p>}
            </div>

            <div>
              <p className="font-medium mb-1">Amenities ({selectedAmenityIds.size})</p>
              {selectedAmenityIds.size > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {allAmenities
                    .filter((a) => selectedAmenityIds.has(a.id))
                    .map((a) => (
                      <span key={a.id} className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium">
                        {a.name}
                      </span>
                    ))}
                </div>
              ) : (
                <p className="text-muted-foreground">None selected</p>
              )}
            </div>

            <div>
              <p className="font-medium mb-1">Landmarks ({landmarks.filter((l) => l.name.trim()).length})</p>
              {landmarks.filter((l) => l.name.trim()).length > 0 ? (
                <ul className="list-disc pl-5 space-y-1">
                  {landmarks.filter((l) => l.name.trim()).map((lm, i) => (
                    <li key={i}>
                      {lm.name}
                      {lm.googleMapsUrl && (
                        <a href={lm.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-primary hover:underline text-xs">
                          Maps
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">None added</p>
              )}
            </div>

            <p className="text-xs text-muted-foreground">After creating the hotel, you'll be redirected to add rooms.</p>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating…</>
                ) : (
                  "Create hotel"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
