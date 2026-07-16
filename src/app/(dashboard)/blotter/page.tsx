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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { Plus } from "lucide-react";

const blotterSchema = z.object({
  complainantName: z.string().min(1, "Complainant name is required"),
  respondentName: z.string().min(1, "Respondent name is required"),
  incidentDate: z.string().min(1, "Incident date is required"),
  incidentType: z.string().min(1, "Incident type is required"),
  narrative: z.string().min(1, "Narrative is required"),
});

type BlotterForm = z.infer<typeof blotterSchema>;

interface Blotter {
  id: string;
  caseNumber: string;
  complainantName: string;
  respondentName: string;
  incidentDate: string;
  incidentType: string;
  narrative: string;
  status: string;
  createdAt: string;
  handledBy: { name: string } | null;
}

export default function BlotterPage() {
  const { data: session } = useSession();
  const [blotters, setBlotters] = useState<Blotter[]>([]);
  const [open, setOpen] = useState(false);
  const role = (session?.user as any)?.role;
  const canCreate = ["ADMIN", "SECRETARY", "KAGAWAD"].includes(role);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BlotterForm>({
    resolver: zodResolver(blotterSchema),
  });

  const fetchBlotters = async () => {
    const res = await fetch("/api/blotter");
    const data = await res.json();
    setBlotters(data || []);
  };

  useEffect(() => { fetchBlotters(); }, []);

  async function onSubmit(data: BlotterForm) {
    const res = await fetch("/api/blotter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast({ title: "Blotter Report Filed", variant: "success" });
      setOpen(false);
      reset();
      fetchBlotters();
    }
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/blotter/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast({ title: "Status Updated", variant: "success" });
      fetchBlotters();
    }
  }

  const statusColors: Record<string, string> = {
    OPEN: "destructive",
    RESOLVED: "success",
    ESCALATED: "warning",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Blotter Reports</h2>
          <p className="text-sm text-gray-500">Incident reports and case management</p>
        </div>
        {canCreate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-900 hover:bg-blue-800">
                <Plus className="mr-2 h-4 w-4" /> File Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>File Blotter Report</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Complainant Name</Label>
                    <Input {...register("complainantName")} />
                    {errors.complainantName && <p className="text-sm text-red-500">{errors.complainantName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Respondent Name</Label>
                    <Input {...register("respondentName")} />
                    {errors.respondentName && <p className="text-sm text-red-500">{errors.respondentName.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Incident Date</Label>
                    <Input type="date" {...register("incidentDate")} />
                    {errors.incidentDate && <p className="text-sm text-red-500">{errors.incidentDate.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Incident Type</Label>
                    <Input {...register("incidentType")} placeholder="e.g., Physical Assault, Theft..." />
                    {errors.incidentType && <p className="text-sm text-red-500">{errors.incidentType.message}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Narrative</Label>
                  <Textarea {...register("narrative")} rows={5} placeholder="Describe the incident..." />
                  {errors.narrative && <p className="text-sm text-red-500">{errors.narrative.message}</p>}
                </div>
                <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800">File Report</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case #</TableHead>
                <TableHead>Complainant</TableHead>
                <TableHead>Respondent</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Handled By</TableHead>
                {canCreate && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {blotters.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-gray-500">No blotter reports</TableCell></TableRow>
              ) : (
                blotters.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono font-medium">{b.caseNumber}</TableCell>
                    <TableCell>{b.complainantName}</TableCell>
                    <TableCell>{b.respondentName}</TableCell>
                    <TableCell>{b.incidentType}</TableCell>
                    <TableCell>{new Date(b.incidentDate).toLocaleDateString("en-PH")}</TableCell>
                    <TableCell>
                      <Badge variant={statusColors[b.status] as any}>{b.status}</Badge>
                    </TableCell>
                    <TableCell>{b.handledBy?.name || "-"}</TableCell>
                    {canCreate && (
                      <TableCell className="text-right">
                        {b.status === "OPEN" && (
                          <Select onValueChange={(v) => updateStatus(b.id, v)}>
                            <SelectTrigger className="w-32"><SelectValue placeholder="Update" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="RESOLVED">Resolved</SelectItem>
                              <SelectItem value="ESCALATED">Escalated</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
