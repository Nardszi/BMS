"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { Plus, Search, Trash2, Eye, Home, Users } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

const householdSchema = z.object({
  householdNumber: z.string().min(1, "Household number is required"),
  address: z.string().min(1, "Address is required"),
  purok: z.string().min(1, "Purok is required"),
  zone: z.string().optional(),
});

type HouseholdForm = z.infer<typeof householdSchema>;

interface Household {
  id: string;
  householdNumber: string;
  address: string;
  purok: string;
  zone: string | null;
  createdAt: string;
}

interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  gender: string;
  birthDate: string;
  contactNumber: string | null;
  status: string;
  householdId: string;
}

export default function HouseholdsPage() {
  const { data: session } = useSession();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [allResidents, setAllResidents] = useState<Resident[]>([]);
  const [search, setSearch] = useState("");
  const [purokFilter, setPurokFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [detailHousehold, setDetailHousehold] = useState<Household | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const role = (session?.user as any)?.role;
  const canManage = ["ADMIN", "SECRETARY"].includes(role);
  const canDelete = role === "ADMIN";

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<HouseholdForm>({
    resolver: zodResolver(householdSchema),
  });

  const fetchHouseholds = async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (purokFilter) params.set("purok", purokFilter);
    const res = await fetch(`/api/households?${params.toString()}`);
    const data = await res.json();
    setHouseholds(data.households || data || []);
  };

  const fetchResidents = async () => {
    const res = await fetch("/api/residents?limit=1000");
    const data = await res.json();
    setAllResidents(data.residents || data || []);
  };

  useEffect(() => { fetchHouseholds(); }, [search, purokFilter]);
  useEffect(() => { fetchResidents(); }, []);

  const getResidentsForHousehold = (householdId: string) =>
    allResidents.filter((r) => r.householdId === householdId);

  async function onSubmit(data: HouseholdForm) {
    try {
      const res = await fetch("/api/households", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          householdNumber: data.householdNumber,
          address: data.address,
          purok: data.purok,
          zone: data.zone || null,
        }),
      });
      if (res.ok) {
        toast({ title: "Household Added", variant: "success" });
        setOpen(false);
        reset();
        fetchHouseholds();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error, variant: "error" });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "error" });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this household?")) return;
    try {
      const res = await fetch(`/api/households/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Household Deleted", variant: "success" });
        fetchHouseholds();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error, variant: "error" });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "error" });
    }
  }

  function openNew() {
    reset();
    setOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Households" subtitle="Manage barangay household records">
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew} className="bg-blue-900 hover:bg-blue-800">
                <Plus className="mr-2 h-4 w-4" /> Add Household
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Household</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Household Number *</Label>
                  <Input {...register("householdNumber")} placeholder="e.g. H-2024-001" />
                  {errors.householdNumber && <p className="text-sm text-red-500">{errors.householdNumber.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Address *</Label>
                  <Input {...register("address")} placeholder="123 Rizal Street" />
                  {errors.address && <p className="text-sm text-red-500">{errors.address.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Purok *</Label>
                    <Select onValueChange={(v) => setValue("purok", v)}>
                      <SelectTrigger><SelectValue placeholder="Select purok" /></SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                          <SelectItem key={p} value={String(p)}>Purok {p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.purok && <p className="text-sm text-red-500">{errors.purok.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Zone</Label>
                    <Input {...register("zone")} placeholder="Optional" />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800">
                  Add Household
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center gap-4 border-b p-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by household number or address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={purokFilter} onValueChange={(v) => setPurokFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All Puroks" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Puroks</SelectItem>
                {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                  <SelectItem key={p} value={String(p)}>Purok {p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Household #</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Purok</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Residents</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {households.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <EmptyState icon={Home} title="No households found" />
                  </TableCell>
                </TableRow>
              ) : (
                households.map((h) => {
                  const residents = getResidentsForHousehold(h.id);
                  return (
                    <TableRow key={h.id}>
                      <TableCell className="font-medium">{h.householdNumber}</TableCell>
                      <TableCell>{h.address}</TableCell>
                      <TableCell>Purok {h.purok}</TableCell>
                      <TableCell>{h.zone || "-"}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-sm text-gray-700">
                          <Users className="h-3.5 w-3.5 text-gray-400" />
                          {residents.length}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setDetailHousehold(h); setShowDetail(true); }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canDelete && (
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(h.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Household Details</DialogTitle>
          </DialogHeader>
          {detailHousehold && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500">Household Number</p>
                  <p className="text-sm font-medium text-gray-900">{detailHousehold.householdNumber}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Address</p>
                  <p className="text-sm text-gray-900">{detailHousehold.address}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Purok</p>
                  <p className="text-sm text-gray-900">Purok {detailHousehold.purok}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Zone</p>
                  <p className="text-sm text-gray-900">{detailHousehold.zone || "-"}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Residents ({getResidentsForHousehold(detailHousehold.id).length})
                </p>
                {getResidentsForHousehold(detailHousehold.id).length === 0 ? (
                  <p className="text-sm text-gray-500">No residents registered in this household.</p>
                ) : (
                  <div className="space-y-2">
                    {getResidentsForHousehold(detailHousehold.id).map((r) => (
                      <div key={r.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {r.lastName}, {r.firstName} {r.middleName || ""}
                          </p>
                          <p className="text-xs text-gray-500">
                            {r.gender} &middot; {r.contactNumber || "No contact"}
                          </p>
                        </div>
                        <StatusBadge status={r.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
