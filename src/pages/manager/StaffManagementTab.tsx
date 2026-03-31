import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Phone, Car, Languages, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import {
  listStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  toggleStaffActive,
  type StaffMember,
  type StaffInput,
  type StaffDesignation,
} from "@/lib/supabase";

interface StaffManagementTabProps {
  hotelId: string;
}

const DESIGNATIONS: Array<{ value: StaffDesignation; label: string }> = [
  { value: 'room_service', label: 'Room Service' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'cook', label: 'Cook' },
  { value: 'housekeeping', label: 'Housekeeping' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'driver', label: 'Driver' },
  { value: 'translator', label: 'Translator' },
];

const HOTEL_REQUIRED_ROLES: StaffDesignation[] = ['room_service', 'cleaning', 'cook', 'housekeeping', 'maintenance'];

export default function StaffManagementTab({ hotelId }: StaffManagementTabProps) {
  const { profile } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [filterDesignation, setFilterDesignation] = useState<string>("all");

  const [form, setForm] = useState<StaffInput>({
    name: "",
    mobile_number: "",
    designation: "room_service",
    hotel_id: hotelId,
    car_name: "",
    car_number: "",
    seating_capacity: undefined,
    languages: [],
  });

  const [languageInput, setLanguageInput] = useState("");

  useEffect(() => {
    loadStaff();
  }, [hotelId, filterDesignation]);

  const loadStaff = async () => {
    setLoading(true);
    const { data, error } = await listStaff(
      hotelId,
      filterDesignation === "all" ? undefined : (filterDesignation as StaffDesignation)
    );

    if (error) {
      toast.error("Failed to load staff");
      setLoading(false);
      return;
    }

    setStaff(data);
    setLoading(false);
  };

  const handleOpenDialog = (staffMember?: StaffMember) => {
    if (staffMember) {
      setEditingStaff(staffMember);
      setForm({
        name: staffMember.name,
        mobile_number: staffMember.mobile_number,
        designation: staffMember.designation,
        hotel_id: staffMember.hotel_id,
        car_name: staffMember.car_name || "",
        car_number: staffMember.car_number || "",
        seating_capacity: staffMember.seating_capacity || undefined,
        languages: staffMember.languages || [],
      });
    } else {
      setEditingStaff(null);
      setForm({
        name: "",
        mobile_number: "",
        designation: "room_service",
        hotel_id: hotelId,
        car_name: "",
        car_number: "",
        seating_capacity: undefined,
        languages: [],
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.mobile_number.trim()) {
      toast.error("Name and mobile number are required");
      return;
    }

    // Validate driver fields
    if (form.designation === 'driver') {
      if (!form.car_name || !form.car_number || !form.seating_capacity) {
        toast.error("Driver requires car details");
        return;
      }
    }

    // Validate translator fields
    if (form.designation === 'translator' && (!form.languages || form.languages.length === 0)) {
      toast.error("Translator requires at least one language");
      return;
    }

    // Set hotel_id for hotel-required roles
    const finalForm = {
      ...form,
      hotel_id: HOTEL_REQUIRED_ROLES.includes(form.designation) ? hotelId : null,
    };

    if (editingStaff) {
      const { error } = await updateStaff(editingStaff.id, finalForm);
      if (error) {
        toast.error("Failed to update staff");
        return;
      }
      toast.success("Staff updated successfully");
    } else {
      const { error } = await createStaff(finalForm);
      if (error) {
        toast.error(error.message || "Failed to create staff");
        return;
      }
      toast.success("Staff created successfully");
    }

    setIsDialogOpen(false);
    loadStaff();
  };

  const handleDelete = async (staffId: string) => {
    if (!confirm("Are you sure you want to delete this staff member?")) return;

    const { error } = await deleteStaff(staffId);
    if (error) {
      toast.error("Failed to delete staff");
      return;
    }

    toast.success("Staff deleted successfully");
    loadStaff();
  };

  const handleToggleActive = async (staffId: string, isActive: boolean) => {
    const { error } = await toggleStaffActive(staffId, !isActive);
    if (error) {
      toast.error("Failed to update staff status");
      return;
    }

    toast.success(`Staff ${!isActive ? 'activated' : 'deactivated'}`);
    loadStaff();
  };

  const addLanguage = () => {
    if (languageInput.trim() && !form.languages?.includes(languageInput.trim())) {
      setForm({
        ...form,
        languages: [...(form.languages || []), languageInput.trim()],
      });
      setLanguageInput("");
    }
  };

  const removeLanguage = (lang: string) => {
    setForm({
      ...form,
      languages: (form.languages || []).filter(l => l !== lang),
    });
  };

  const isDriverRole = form.designation === 'driver';
  const isTranslatorRole = form.designation === 'translator';

  const filteredStaff = staff;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Select value={filterDesignation} onValueChange={setFilterDesignation}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {DESIGNATIONS.map(d => (
                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingStaff ? 'Edit Staff' : 'Add New Staff'}</DialogTitle>
              <DialogDescription>
                {editingStaff ? 'Update staff member details' : 'Add a new staff member to your team'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Full name"
                  />
                </div>

                <div>
                  <Label>Mobile Number *</Label>
                  <Input
                    value={form.mobile_number}
                    onChange={(e) => setForm({ ...form, mobile_number: e.target.value })}
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>

              <div>
                <Label>Designation *</Label>
                <Select
                  value={form.designation}
                  onValueChange={(v) => setForm({ ...form, designation: v as StaffDesignation })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DESIGNATIONS.map(d => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {HOTEL_REQUIRED_ROLES.includes(form.designation) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    This role will be assigned to the current hotel
                  </p>
                )}
              </div>

              {isDriverRole && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Driver Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Car Name *</Label>
                      <Input
                        value={form.car_name || ""}
                        onChange={(e) => setForm({ ...form, car_name: e.target.value })}
                        placeholder="Toyota Innova"
                      />
                    </div>
                    <div>
                      <Label>Car Number *</Label>
                      <Input
                        value={form.car_number || ""}
                        onChange={(e) => setForm({ ...form, car_number: e.target.value })}
                        placeholder="HR-26-AB-1234"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Seating Capacity *</Label>
                    <Input
                      type="number"
                      value={form.seating_capacity || ""}
                      onChange={(e) => setForm({ ...form, seating_capacity: parseInt(e.target.value) })}
                      placeholder="7"
                      min="1"
                      max="50"
                    />
                  </div>
                </div>
              )}

              {isTranslatorRole && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Languages className="h-4 w-4" />
                    Languages
                  </h4>
                  <div className="flex gap-2">
                    <Input
                      value={languageInput}
                      onChange={(e) => setLanguageInput(e.target.value)}
                      placeholder="Add language (e.g., Hindi, English)"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                    />
                    <Button type="button" onClick={addLanguage} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(form.languages || []).map(lang => (
                      <Badge key={lang} variant="secondary" className="cursor-pointer" onClick={() => removeLanguage(lang)}>
                        {lang} <span className="ml-1">×</span>
                      </Badge>
                    ))}
                  </div>
                  {(!form.languages || form.languages.length === 0) && (
                    <p className="text-xs text-destructive">At least one language is required</p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit}>
                  {editingStaff ? 'Update' : 'Create'} Staff
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Staff Members</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No staff members found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map(member => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3" />
                        {member.mobile_number}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {DESIGNATIONS.find(d => d.value === member.designation)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {member.designation === 'driver' && (
                        <div className="text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Car className="h-3 w-3" />
                            {member.car_name} ({member.car_number})
                          </div>
                          <div>{member.seating_capacity} seater</div>
                        </div>
                      )}
                      {member.designation === 'translator' && (
                        <div className="flex flex-wrap gap-1">
                          {(member.languages || []).map(lang => (
                            <Badge key={lang} variant="secondary" className="text-xs">
                              {lang}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {!['driver', 'translator'].includes(member.designation) && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleActive(member.id, member.is_active)}
                        className="h-8 px-2"
                      >
                        {member.is_active ? (
                          <>
                            <ToggleRight className="h-4 w-4 mr-1 text-success" />
                            <span className="text-xs text-success">Active</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="h-4 w-4 mr-1 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Inactive</span>
                          </>
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenDialog(member)}
                          className="h-8 px-2"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(member.id)}
                          className="h-8 px-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
