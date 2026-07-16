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
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { Plus, AlertTriangle } from "lucide-react";

const permitSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  ownerResidentId: z.string().min(1, "Owner is required"),
  businessType: z.string().min(1, "Business type is required"),
  address: z.string().min(1, "Address is required"),
  permitNumber: z.string().min(1, "Permit number is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
});

type PermitForm = z.infer<typeof permitSchema>;

interface Permit {
  id: string;
  businessName: string;
  businessType: string;
  address: string;
  permitNumber: string;
  issueDate: string;
  expiryDate: string;
  status: string;
  owner: { firstName: string; lastName: string; middleName: string | null };
}

interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
}

export default function PermitsPage() {
  const { data: session } = useSession();
  const [permits, setPermits] = useState<Permit[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [open, setOpen] = useState(false);
  const [showExpiring, setShowExpiring] = useState(false);
  const role = (session?.user as any)?.role;
  const canManage = ["ADMIN", "TREASURER"].includes(role);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<PermitForm>({
    resolver: zodResolver(permitSchema),
  });

  const fetchPermits = async () => {
    const params = showExpiring ? "?expiringSoon=true" : "";
    const res = await fetch(`/api/permits${params}`);
    const data = await res.json();
    setPermits(data || []);
  };

  const fetchResidents = async () => {
    const res = await fetch("/api/residents?limit=1000");
    const data = await res.json();
    setResidents(data.residents || []);
  };

  useEffect(() => { fetchPermits(); fetchResidents(); }, [showExpiring]);

  async function onSubmit(data: PermitForm) {
    const res = await fetch("/api/permits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast({ title: "Permit Created", variant: "success" });
      setOpen(false);
      reset();
      fetchPermits();
    }
  }

  async function revokePermit(id: string) {
    const res = await fetch(`/api/permits/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "REVOKED" }),
    });
    if (res.ok) {
      toast({ title: "Permit Revoked", variant: "success" });
      fetchPermits();
    }
  }

  const getDaysUntilExpiry = (expiryDate: string) => {
    const diff = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Business Permits</h2>
          <p className="text-sm text-gray-500">Track and manage business permits</p>
        </div>
        <div className="flex gap-2">
          <Button variant={showExpiring ? "default" : "outline"} onClick={() => setShowExpiring(!showExpiring)}>
            <AlertTriangle className="mr-2 h-4 w-4" /> Expiring Soon
          </Button>
          {canManage && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-900 hover:bg-blue-800">
                  <Plus className="mr-2 h-4 w-4" /> New Permit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Business Permit</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Business Name</Label>
                    <Input {...register("businessName")} />
                    {errors.businessName && <p className="text-sm text-red-500">{errors.businessName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Owner</Label>
                    <Select onValueChange={(v) => setValue("ownerResidentId", v)}>
                      <SelectTrigger><SelectValue placeholder="Select owner" /></SelectTrigger>
                      <SelectContent>
                        {residents.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.lastName}, {r.firstName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Business Type</Label>
                      <Input {...register("businessType")} placeholder="e.g., Sari-Sari Store" />
                    </div>
                    <div className="space-y-2">
                      <Label>Permit Number</Label>
                      <Input {...register("permitNumber")} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input {...register("address")} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Issue Date</Label>
                      <Input type="date" {...register("issueDate")} />
                    </div>
                    <div className="space-y-2">
                      <Label>Expiry Date</Label>
                      <Input type="date" {...register("expiryDate")} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800">Create Permit</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Permit #</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Status</TableHead>
                {canManage && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {permits.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-gray-500">No permits found</TableCell></TableRow>
              ) : (
                permits.map((p) => {
                  const daysLeft = getDaysUntilExpiry(p.expiryDate);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono">{p.permitNumber}</TableCell>
                      <TableCell className="font-medium">{p.businessName}</TableCell>
                      <TableCell>{p.owner.lastName}, {p.owner.firstName}</TableCell>
                      <TableCell>{p.businessType}</TableCell>
                      <TableCell>
                        <span className={daysLeft <= 30 && daysLeft > 0 ? "text-amber-600 font-medium" : daysLeft <= 0 ? "text-red-600 font-medium" : ""}>
                          {new Date(p.expiryDate).toLocaleDateString("en-PH")}
                          {daysLeft <= 30 && daysLeft > 0 && ` (${daysLeft} days)`}
                          {daysLeft <= 0 && " (EXPIRED)"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.status === "ACTIVE" ? "success" : p.status === "EXPIRED" ? "destructive" : "secondary"}>
                          {p.status}
                        </Badge>
                      </TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          {p.status === "ACTIVE" && (
                            <Button variant="ghost" size="sm" onClick={() => revokePermit(p.id)}>
                              Revoke
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
