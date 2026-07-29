"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, useRef, useState } from "react";
import { relativeTime } from "@/lib/time";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { useToast } from "./ui/Toast";

type DocItem = {
  id: string;
  title: string;
  updatedAt: string;
  owner?: { name: string; email: string };
  role?: string;
};

type Props = {
  userName: string;
  userEmail: string;
  owned: DocItem[];
  shared: DocItem[];
};

export function DashboardClient({ userName, userEmail, owned, shared }: Props) {
  const router = useRouter();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);

  async function createDoc() {
    setCreating(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled document" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not create document");
        return;
      }
      router.push(`/docs/${data.document.id}`);
    } catch {
      toast.error("Network error while creating");
    } finally {
      setCreating(false);
    }
  }

  async function onImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImporting(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/documents/import", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Import failed");
        return;
      }
      toast.success("Imported successfully");
      router.push(`/docs/${data.document.id}`);
    } catch {
      toast.error("Network error while importing");
    } finally {
      setImporting(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const busy = creating || importing;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
            DocsLite
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--ink)]">
            Your documents
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {userName} · {userEmail}
          </p>
        </div>
        <Button variant="secondary" onClick={logout}>
          Sign out
        </Button>
      </header>

      <div className="mb-3 flex flex-wrap gap-2">
        <Button onClick={createDoc} loading={creating} disabled={busy}>
          {creating ? "Creating…" : "New document"}
        </Button>
        <Button
          variant="secondary"
          disabled={busy}
          loading={importing}
          onClick={() => fileRef.current?.click()}
        >
          {importing ? "Importing…" : "Import .txt / .md"}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.md,text/plain,text/markdown"
          className="hidden"
          onChange={onImport}
        />
      </div>
      <p className="mb-8 text-xs text-[var(--muted)]">
        Imports accept .txt and .md only, up to 1MB.
      </p>

      <Section
        title="Owned by you"
        emptyTitle="No documents yet"
        emptyBody="Create a blank doc or import a text file to get started."
        emptyActionLabel="Create your first document"
        onEmptyAction={createDoc}
        emptyBusy={creating}
        items={owned}
      />
      <Section
        title="Shared with you"
        emptyTitle="Nothing shared yet"
        emptyBody="Documents others share with you will appear here."
        items={shared}
        showOwner
      />
    </div>
  );
}

function Section({
  title,
  emptyTitle,
  emptyBody,
  emptyActionLabel,
  onEmptyAction,
  emptyBusy,
  items,
  showOwner,
}: {
  title: string;
  emptyTitle: string;
  emptyBody: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  emptyBusy?: boolean;
  items: DocItem[];
  showOwner?: boolean;
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
        {title}
      </h2>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-5 py-8 text-center">
          <p className="font-medium text-[var(--ink)]">{emptyTitle}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">{emptyBody}</p>
          {emptyActionLabel && onEmptyAction ? (
            <div className="mt-4 flex justify-center">
              <Button onClick={onEmptyAction} loading={emptyBusy}>
                {emptyBusy ? "Creating…" : emptyActionLabel}
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <ul className="divide-y divide-[var(--border)] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          {items.map((doc) => (
            <li key={doc.id}>
              <Link
                href={`/docs/${doc.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--surface-muted)]"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-[var(--ink)]">
                    {doc.title}
                  </p>
                  <p
                    className="mt-0.5 text-xs text-[var(--muted)]"
                    title={new Date(doc.updatedAt).toLocaleString()}
                  >
                    {relativeTime(doc.updatedAt)}
                    {showOwner && doc.owner ? ` · ${doc.owner.name}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {doc.role ? (
                    <Badge
                      tone={doc.role === "viewer" ? "warning" : "success"}
                    >
                      {doc.role === "viewer" ? "Viewer" : "Editor"}
                    </Badge>
                  ) : null}
                  <span className="text-xs text-[var(--muted)]">Open</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
