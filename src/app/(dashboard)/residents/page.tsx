"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";

const residentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  middleName: z.string().optional(),
  birthDate: z.string().min(1, "Birth date is required"),
  gender: z.enum(["MALE", "FEMALE"]),
  civilStatus: z.enum(["SINGLE", "MARRIED", "WIDOWED", "SEPARATED", "DIVORCED"]),
  householdId: z.string().min(1, "Household is required"),
  occupation: z.string().optional(),
  contactNumber: z.string().optional(),
  isRegisteredVoter: z.boolean().optional(),
});

type ResidentForm = z.infer<typeof residentSchema>;

interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  birthDate: string;
  gender: string;
  civilStatus: string;
  occupation: string | null;
  contactNumber: string | null;
  isRegisteredVoter: boolean;
  household: { id: string; householdNumber: string; purok: string; address: string };
}

interface Household {
  id: string;
  householdNumber: string;
  purok: string;
  address: string;
  _count: { residents: number };
}

export default function ResidentsPage() {
  const { data: session } = useSession();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Resident | null>(null);
  const [purokFilter, setPurokFilter] = useState("");

  const role = (session?.user as any)?.role;
  const canEdit = ["ADMIN", "SECRETARY", "STAFF"].includes(role);
  const canDelete = ["ADMIN", "SECRETARY"].includes(role);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ResidentForm>({
    resolver: zodResolver(residentSchema),
  });

  const fetchResidents = async () => {
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (search) params.set("search", search);
    if (purokFilter) params.set("purok", purokFilter);
    const res = await fetch(`/api/residents?${params}`);
    const data = await res.json();
    setResidents(data.residents || []);
    setTotalPages(data.totalPages || 1);
  };

  const fetchHouseholds = async () => {
    const res = await fetch("/api/households");
    const data = await res.json();
    setHouseholds(data || []);
  };

  useEffect(() => { fetchResidents(); }, [page, search, purokFilter]);
  useEffect(() => { fetchHouseholds(); }, []);

  async function onSubmit(data: ResidentForm) {
    try {
      const url = editing ? `/api/residents/${editing.id}` : "/api/residents";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, isRegisteredVoter: watch("isRegisteredVoter") || false }),
      });
      if (res.ok) {
        toast({ title: editing ? "Resident Updated" : "Resident Added", variant: "success" });
        setOpen(false);
        setEditing(null);
        reset();
        fetchResidents();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error || "Something went wrong", variant: "error" });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "error" });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this resident?")) return;
    const res = await fetch(`/api/residents/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Resident Deleted", variant: "success" });
      fetchResidents();
    }
  }

  function openEdit(resident: Resident) {
    setEditing(resident);
    setValue("firstName", resident.firstName);
    setValue("lastName", resident.lastName);
    setValue("middleName", resident.middleName || "");
    setValue("birthDate", resident.birthDate.split("T")[0]);
    setValue("gender", resident.gender as any);
    setValue("civilStatus", resident.civilStatus as any);
    setValue("householdId", resident.household.id);
    setValue("occupation", resident.occupation || "");
    setValue("contactNumber", resident.contactNumber || "");
    setValue("isRegisteredVoter", resident.isRegisteredVoter);
    setOpen(true);
  }

  function openNew() {
    setEditing(null);
    reset();
    setOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Residents</h2>
          <p className="text-sm text-gray-500">Manage barangay resident records</p>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew} className="bg-blue-900 hover:bg-blue-800">
                <Plus className="mr-2 h-4 w-4" /> Add Resident
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Resident" : "Add New Resident"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input {...register("firstName")} />
                    {errors.firstName && <p className="text-sm text-red-500">{errors.firstName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input {...register("lastName")} />
                    {errors.lastName && <p className="text-sm text-red-500">{errors.lastName.message}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Middle Name</Label>
                  <Input {...register("middleName")} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Birth Date</Label>
                    <Input type="date" {...register("birthDate")} />
                    {errors.birthDate && <p className="text-sm text-red-500">{errors.birthDate.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select onValueChange={(v) => setValue("gender", v as any)} defaultValue={editing?.gender}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Civil Status</Label>
                    <Select onValueChange={(v) => setValue("civilStatus", v as any)} defaultValue={editing?.civilStatus}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SINGLE">Single</SelectItem>
                        <SelectItem value="MARRIED">Married</SelectItem>
                        <SelectItem value="WIDOWED">Widowed</SelectItem>
                        <SelectItem value="SEPARATED">Separated</SelectItem>
                        <SelectItem value="DIVORCED">Divorced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Household</Label>
                    <Select onValueChange={(v) => setValue("householdId", v)} defaultValue={editing?.household.id}>
                      <SelectTrigger><SelectValue placeholder="Select household" /></SelectTrigger>
                      <SelectContent>
                        {households.map((h) => (
                          <SelectItem key={h.id} value={h.id}>
                            {h.householdNumber} - Purok {h.purok}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.householdId && <p className="text-sm text-red-500">{errors.householdId.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Occupation</Label>
                    <Input {...register("occupation")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Number</Label>
                    <Input {...register("contactNumber")} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="voter" {...register("isRegisteredVoter")} className="rounded" />
                  <Label htmlFor="voter">Registered Voter</Label>
                </div>
                <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800">
                  {editing ? "Update" : "Add"} Resident
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input placeholder="Search residents..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
            </div>
            <Select value={purokFilter} onValueChange={(v) => { setPurokFilter(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-48"><SelectValue placeholder="All Puroks" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Puroks</SelectItem>
                {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                  <SelectItem key={p} value={String(p)}>Purok {p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Civil Status</TableHead>
                <TableHead>Purok</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Voter</TableHead>
                {canEdit && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {residents.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-gray-500">No residents found</TableCell></TableRow>
              ) : (
                residents.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {r.lastName}, {r.firstName} {r.middleName}
                    </TableCell>
                    <TableCell>{r.gender}</TableCell>
                    <TableCell>{r.civilStatus}</TableCell>
                    <TableCell>{r.household.purok}</TableCell>
                    <TableCell>{r.contactNumber || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={r.isRegisteredVoter ? "success" : "secondary"}>
                        {r.isRegisteredVoter ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {canDelete && (
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
