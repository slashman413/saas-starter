"use client";

import { useEffect, useState } from "react";
import { Button, Input, Card } from "@/components/ui";

type Member = { id: string; role: string; user: { name: string | null; email: string } };
type Invitation = { id: string; email: string; role: string };

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBER");

  async function load() {
    const res = await fetch("/api/members");
    const json = await res.json();
    setMembers(json.data?.members ?? []);
    setInvitations(json.data?.invitations ?? []);
  }
  useEffect(() => { load(); }, []);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    setEmail("");
    load();
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">Members</h1>

      <form onSubmit={invite} className="mt-6 flex gap-2">
        <Input placeholder="teammate@company.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="MEMBER">Member</option>
          <option value="ADMIN">Admin</option>
        </select>
        <Button type="submit">Invite</Button>
      </form>

      <Card className="mt-6 divide-y divide-gray-100">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between px-5 py-3 text-sm">
            <span>{m.user.name ?? m.user.email}</span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{m.role}</span>
          </div>
        ))}
        {invitations.map((i) => (
          <div key={i.id} className="flex items-center justify-between px-5 py-3 text-sm text-gray-400">
            <span>{i.email} (pending)</span>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">{i.role}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
