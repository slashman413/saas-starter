"use client";

import { useEffect, useState } from "react";
import { Button, Input, Card } from "@/components/ui";

type Key = { id: string; name: string; prefix: string; lastUsedAt: string | null; createdAt: string };

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<Key[]>([]);
  const [name, setName] = useState("");
  const [revealed, setRevealed] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/api-keys");
    const json = await res.json();
    setKeys(json.data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const json = await res.json();
    setRevealed(json.data?.key ?? null); // shown only once
    setName("");
    load();
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">API keys</h1>
      <p className="mt-1 text-sm text-gray-500">
        Use with the public API: <code className="rounded bg-gray-100 px-1">Authorization: Bearer sk_live_…</code>
      </p>

      <form onSubmit={create} className="mt-6 flex gap-2">
        <Input placeholder="Key name (e.g. CI pipeline)" value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit">Create key</Button>
      </form>

      {revealed && (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm">
          <p className="font-medium text-amber-800">Copy this key now — it won’t be shown again:</p>
          <code className="mt-2 block break-all rounded bg-white px-2 py-1">{revealed}</code>
        </div>
      )}

      <Card className="mt-6 divide-y divide-gray-100">
        {keys.length === 0 ? (
          <p className="p-5 text-sm text-gray-500">No keys yet.</p>
        ) : (
          keys.map((k) => (
            <div key={k.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <span>
                <span className="font-medium">{k.name}</span>{" "}
                <code className="text-gray-400">{k.prefix}…</code>
              </span>
              <span className="text-xs text-gray-400">
                {k.lastUsedAt ? `used ${new Date(k.lastUsedAt).toLocaleDateString()}` : "never used"}
              </span>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
