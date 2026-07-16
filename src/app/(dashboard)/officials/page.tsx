"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { Plus, Shield, Trash2 } from "lucide-react";

const officialSchema = z.object({
  userId: z.string().min(1, "User is required"),
  position: z.string().min(1, "Position is required"),
  termStart: z.string().min(1, "Term start is required"),
  termEnd: z.string().min(1, "Term end is required"),
});

type OfficialForm = z.infer<typeof officialSchema>;

interface Official {
  id: string;
  position: string;
  termStart: string;
  termEnd: string;
  user: { id: string; name: string; email: string; role: string };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function OfficialsPage() {
  const { data: session } = useSession();
  const [officials, setOfficials] = useState<Official[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const role = (session?.user as any)?.role;

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<OfficialForm>({
    resolver: zodResolver(officialSchema),
  });

  const fetchOfficials = async () => {
    const res = await fetch("/api/officials");
    const data = await res.json();
    setOfficials(data || []);
  };

  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data || []);
    }
  };

  useEffect(() => { fetchOfficials(); fetchUsers(); }, []);

  async function onSubmit(data: OfficialForm) {
    const res = await fetch("/api/officials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast({ title: "Official Assigned", variant: "success" });
      setOpen(false);
      reset();
      fetchOfficials();
    }
  }

  async function removeOfficial(id: string) {
    if (!confirm("Remove this official?")) return;
    const res = await fetch(`/api/officials/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Official Removed", variant: "success" });
      fetchOfficials();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Barangay Officials</h2>
          <p className="text-sm text-gray-500">Manage current officials and their terms</p>
        </div>
        {role === "ADMIN" && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-900 hover:bg-blue-800">
                <Plus className="mr-2 h-4 w-4" /> Assign Official
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign New Official</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label>User</Label>
                  <Select onValueChange={(v) => setValue("userId", v)}>
                    <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Input {...register("position")} placeholder="e.g., Barangay Captain, Kagawad..." />
                  {errors.position && <p className="text-sm text-red-500">{errors.position.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Term Start</Label>
                    <Input type="date" {...register("termStart")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Term End</Label>
                    <Input type="date" {...register("termEnd")} />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800">Assign</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {officials.map((o) => (
          <Card key={o.id}>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="rounded-lg bg-blue-50 p-2">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">{o.user.name}</CardTitle>
                <p className="text-sm text-gray-500">{o.user.email}</p>
              </div>
              {role === "ADMIN" && (
                <Button variant="ghost" size="sm" onClick={() => removeOfficial(o.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-blue-900">{o.position}</p>
              <p className="text-sm text-gray-500">
                Term: {new Date(o.termStart).toLocaleDateString("en-PH")} - {new Date(o.termEnd).toLocaleDateString("en-PH")}
              </p>
            </CardContent>
          </Card>
        ))}
        {officials.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center text-gray-500">
              No officials assigned yet.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
