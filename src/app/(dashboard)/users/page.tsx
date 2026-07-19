"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { Plus, Trash2, Pencil, Users, Shield } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

const ROLES = ["ADMIN", "SECRETARY", "TREASURER", "KAGAWAD", "STAFF"] as const;

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-800",
  SECRETARY: "bg-blue-100 text-blue-800",
  TREASURER: "bg-emerald-100 text-emerald-800",
  KAGAWAD: "bg-amber-100 text-amber-800",
  STAFF: "bg-gray-100 text-gray-800",
};

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  lastLoginAt: string | null;
}

export default function UsersPage() {
  const { data: session } = useSession();
  const role = session?.user?.role ?? "";
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data || []);
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  function openCreate() {
    setEditing(null);
    setName("");
    setEmail("");
    setPassword("");
    setSelectedRole("STAFF");
    setOpen(true);
  }

  function openEdit(u: User) {
    setEditing(u);
    setName(u.name);
    setEmail(u.email);
    setPassword("");
    setSelectedRole(u.role);
    setOpen(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !selectedRole) {
      toast({ title: "Please fill all required fields", variant: "error" });
      return;
    }

    const body: any = { name, email, role: selectedRole };
    if (password) body.password = password;

    if (!editing && !password) {
      toast({ title: "Password is required for new users", variant: "error" });
      return;
    }

    const url = editing ? `/api/users/${editing.id}` : "/api/users";
    const method = editing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      toast({ title: editing ? "User updated" : "User created", variant: "success" });
      setOpen(false);
      setEditing(null);
      fetchUsers();
    } else {
      const err = await res.json();
      toast({ title: err.error || "Something went wrong", variant: "error" });
    }
  }

  async function deleteUser(id: string) {
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "User deleted", variant: "success" });
      setDeletingId(null);
      fetchUsers();
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-gray-500">Loading users...</p></div>;
  }

  if (role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="h-12 w-12 text-red-400 mb-3" />
        <p className="text-gray-500 font-medium">Access Denied</p>
        <p className="text-sm text-gray-400 mt-1">Only administrators can manage users.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="User Management" subtitle="Manage system users and their roles">
        <Button className="bg-blue-900 hover:bg-blue-800" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </PageHeader>

      {users.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState icon={Users} title="No users found" description="Add your first user to get started." />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[u.role] || "bg-gray-100 text-gray-800"}`}>
                        {u.role}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(u.createdAt).toLocaleDateString("en-PH")}</TableCell>
                    <TableCell>
                      {u.lastLoginAt
                        ? new Date(u.lastLoginAt).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })
                        : <span className="text-gray-400 italic">Never</span>
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(u)} aria-label="Edit">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeletingId(u.id)} aria-label="Delete">
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit User" : "Add User"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Password {editing && <span className="text-gray-400 font-normal">(leave blank to keep current)</span>}</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={editing ? "••••••••" : "Password"} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800">
              {editing ? "Update" : "Create"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">Are you sure you want to delete this user? This action cannot be undone.</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deletingId && deleteUser(deletingId)}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
