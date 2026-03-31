import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  createRoomType,
  createRoom,
  insertRoomTypeImage,
  isSupabaseConfigured,
  uploadRoomTypeImageCompressed,
  invalidateCatalogCache,
  supabase,
} from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";

type DiscountType = "none" | "percentage" | "flat";

interface RoomForm {
  name: string;
  basePrice: string;
  maxGuests: string;
  roomCount: string;
  roomNumbers: string[];
  discountType: DiscountType;
  discountValue: string;
  images: File[];
}

function generateDefaultRoomNumbers(typeName: string, count: number): string[] {
  const prefix = (typeName.trim().slice(0, 3) || "RM").toUpperCase().replace(/\s/g, "");
  return Array.from({ length: count }, (_, i) => `${prefix}-${String(i + 1).padStart(2, "0")}`);
}

const emptyRoom = (): RoomForm => ({
  name: "",
  basePrice: "",
  maxGuests: "2",
  roomCount: "1",
  roomNumbers: [""],
  discountType: "none",
  discountValue: "",
  images: [],
});

function calcFinalPrice(basePrice: string, discountType: DiscountType, discountValue: string): number | null {
  const bp = Number(basePrice);
  if (!Number.isFinite(bp) || bp <= 0) return null;
  if (discountType === "none") return bp;
  const trimmed = discountValue.trim();
  if (trimmed === "") return null;
  const dv = Number(trimmed);
  if (!Number.isFinite(dv) || dv < 0) return null;
  if (discountType === "percentage") return Math.max(0, bp - (bp * dv) / 100);
  if (discountType === "flat") return Math.max(0, bp - dv);
  return bp;
}

export default function AdminAddRooms() {
  const { hotelId } = useParams<{ hotelId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const hasSupabase = isSupabaseConfigured();

  const [hotelName, setHotelName] = useState<string | null>(null);
  const [rooms, setRooms] = useState<RoomForm[]>([emptyRoom()]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!hasSupabase || !hotelId) return;
    supabase
      .from("hotels")
      .select("name")
      .eq("id", hotelId)
      .single()
      .then(({ data }) => {
        if (data) setHotelName((data as { name: string }).name);
      });
  }, [hasSupabase, hotelId]);

  const updateRoom = (idx: number, patch: Partial<RoomForm>) =>
    setRooms((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const validate = (): string | null => {
    if (rooms.length < 1) return "Add at least one room type.";
    const allNumbers = new Set<string>();
    for (let i = 0; i < rooms.length; i++) {
      const r = rooms[i];
      if (!r.name.trim()) return `Room type ${i + 1}: name is required.`;
      const price = Number(r.basePrice);
      if (!Number.isFinite(price) || price <= 0) return `Room type ${i + 1}: price must be > 0.`;
      const rc = Number(r.roomCount);
      if (!Number.isFinite(rc) || rc < 1) return `Room type ${i + 1}: total rooms must be >= 1.`;
      if (r.roomNumbers.length !== rc) return `Room type ${i + 1}: room numbers count doesn't match.`;
      for (let j = 0; j < r.roomNumbers.length; j++) {
        const num = r.roomNumbers[j].trim();
        if (!num) return `Room type ${i + 1}, Room ${j + 1}: room number is required.`;
        if (allNumbers.has(num.toLowerCase())) return `Room type ${i + 1}, Room ${j + 1}: "${num}" is a duplicate room number.`;
        allNumbers.add(num.toLowerCase());
      }
      if (r.images.length < 1) return `Room type ${i + 1}: upload at least one image.`;
      if (r.discountType !== "none") {
        const dv = Number(r.discountValue.trim());
        if (r.discountValue.trim() === "" || !Number.isFinite(dv) || dv <= 0) return `Room type ${i + 1}: discount value is required.`;
        if (r.discountType === "percentage" && dv > 100) return `Room type ${i + 1}: percentage cannot exceed 100.`;
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      toast({ title: "Validation", description: err, variant: "destructive" });
      return;
    }
    if (!hotelId || !user) return;

    setSubmitting(true);
    try {
      for (const roomForm of rooms) {
        const { data: rt, error: rtErr } = await createRoomType(hotelId, {
          name: roomForm.name.trim(),
          maxGuests: Number(roomForm.maxGuests) || undefined,
          basePrice: Number(roomForm.basePrice),
          discountType: roomForm.discountType,
          discountValue: roomForm.discountType !== "none" ? Number(roomForm.discountValue.trim()) : 0,
        });
        if (rtErr || !rt) {
          toast({ title: "Error creating room type", description: rtErr?.message, variant: "destructive" });
          setSubmitting(false);
          return;
        }

        for (let imgIdx = 0; imgIdx < roomForm.images.length; imgIdx++) {
          const up = await uploadRoomTypeImageCompressed(user.id, rt.id, roomForm.images[imgIdx], 120);
          if (up.error) {
            toast({ title: "Image upload failed", description: up.error.message, variant: "destructive" });
            setSubmitting(false);
            return;
          }
          await insertRoomTypeImage(rt.id, up.data!.publicUrl, imgIdx, imgIdx === 0);
        }

        for (const rn of roomForm.roomNumbers) {
          const trimmed = rn.trim();
          if (!trimmed) continue;
          await createRoom(hotelId, { roomTypeId: rt.id, roomNumber: trimmed, status: "available" });
        }
      }

      invalidateCatalogCache();
      toast({ title: "Rooms added successfully" });
      navigate("/hotels-mgmt", { replace: true });
    } catch (e) {
      toast({ title: "Error", description: String(e), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!hasSupabase || (user?.role !== "admin" && user?.role !== "owner")) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Access denied.{" "}
        <Link to="/dashboard" className="text-primary underline">Back</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/hotels-mgmt"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-heading font-bold">Add Rooms{hotelName ? ` — ${hotelName}` : ""}</h1>
          <p className="text-sm text-muted-foreground">Define room types, set pricing, and name each individual room.</p>
        </div>
      </div>

      {rooms.map((room, idx) => {
        const fp = calcFinalPrice(room.basePrice, room.discountType, room.discountValue);
        return (
          <Card key={idx}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Room type {idx + 1}</CardTitle>
                {rooms.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => setRooms((r) => r.filter((_, i) => i !== idx))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Room type name *</Label>
                <Input value={room.name} onChange={(e) => updateRoom(idx, { name: e.target.value })} placeholder="e.g. Deluxe Double" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Base price / night *</Label>
                  <Input type="number" min={1} value={room.basePrice} onChange={(e) => updateRoom(idx, { basePrice: e.target.value })} />
                </div>
                <div>
                  <Label>Max guests</Label>
                  <Input type="number" min={1} value={room.maxGuests} onChange={(e) => updateRoom(idx, { maxGuests: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Discount type</Label>
                  <Select value={room.discountType} onValueChange={(v) => updateRoom(idx, { discountType: v as DiscountType, discountValue: v === "none" ? "" : room.discountValue })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="flat">Flat amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Discount value</Label>
                  <Input
                    type="number"
                    min={0}
                    disabled={room.discountType === "none"}
                    value={room.discountValue}
                    onChange={(e) => updateRoom(idx, { discountValue: e.target.value })}
                    placeholder={room.discountType === "percentage" ? "e.g. 20" : "e.g. 500"}
                  />
                </div>
                <div>
                  <Label>Final price</Label>
                  <div className="h-10 flex items-center px-3 rounded-md border bg-muted text-sm font-medium">
                    {fp !== null ? `₹${fp.toFixed(0)}` : "—"}
                  </div>
                </div>
              </div>

              {room.discountType !== "none" && fp !== null && Number(room.basePrice) > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="line-through text-muted-foreground">₹{Number(room.basePrice).toFixed(0)}</span>
                  <span className="font-semibold text-green-600">₹{fp.toFixed(0)}</span>
                  <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium">
                    {room.discountType === "percentage"
                      ? `${room.discountValue}% OFF`
                      : `₹${room.discountValue} OFF`}
                  </span>
                </div>
              )}

              {/* Room count + individual room numbers */}
              <div className="space-y-3">
                <div>
                  <Label>Number of rooms *</Label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={room.roomCount}
                    onChange={(e) => {
                      const val = e.target.value;
                      const count = Math.max(0, Math.min(50, Math.floor(Number(val) || 0)));
                      const current = room.roomNumbers;
                      let next: string[];
                      if (count > current.length) {
                        const defaults = generateDefaultRoomNumbers(room.name, count);
                        next = [...current, ...defaults.slice(current.length)];
                      } else {
                        next = current.slice(0, count);
                      }
                      updateRoom(idx, { roomCount: val, roomNumbers: next });
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the count, then name each room below. Customers will see these room numbers.
                  </p>
                </div>

                {room.roomNumbers.length > 0 && (
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                    <p className="text-sm font-medium">Room numbers / names</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {room.roomNumbers.map((rn, rnIdx) => (
                        <div key={rnIdx} className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                            #{rnIdx + 1}
                          </span>
                          <Input
                            value={rn}
                            onChange={(e) => {
                              const updated = [...room.roomNumbers];
                              updated[rnIdx] = e.target.value;
                              updateRoom(idx, { roomNumbers: updated });
                            }}
                            className="pl-9 h-9 text-sm"
                            placeholder={`Room ${rnIdx + 1}`}
                          />
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        const count = room.roomNumbers.length;
                        const defaults = generateDefaultRoomNumbers(room.name, count);
                        updateRoom(idx, { roomNumbers: defaults });
                      }}
                    >
                      Auto-generate names
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <Label>Images (at least one) *</Label>
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(e) => {
                    const files = e.target.files ? Array.from(e.target.files) : [];
                    updateRoom(idx, { images: files });
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">{room.images.length} file(s) selected</p>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Button type="button" variant="outline" onClick={() => setRooms((r) => [...r, emptyRoom()])}>
        <Plus className="h-4 w-4 mr-2" /> Add room type
      </Button>

      <div className="flex gap-2">
        <Button variant="outline" asChild>
          <Link to="/hotels-mgmt">Cancel</Link>
        </Button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating rooms…</>
          ) : (
            `Create ${rooms.length} room type${rooms.length > 1 ? "s" : ""}`
          )}
        </Button>
      </div>
    </div>
  );
}
