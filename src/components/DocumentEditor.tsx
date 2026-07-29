"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { RichEditor } from "./RichEditor";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Modal } from "./ui/Modal";
import { useToast } from "./ui/Toast";

type UserOpt = { id: string; email: string; name: string };
type Share = { id: string; role: string; user: UserOpt | null };

type Props = {
  documentId: string;
  initialTitle: string;
  initialContent: string;
  access: "owner" | "editor" | "viewer";
  ownerLabel: string;
};

export function DocumentEditor({
  documentId,
  initialTitle,
  initialContent,
  access,
  ownerLabel,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const canWrite = access !== "viewer";
  const isOwner = access === "owner";

  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [shareOpen, setShareOpen] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [grantBusy, setGrantBusy] = useState(false);
  const [users, setUsers] = useState<UserOpt[]>([]);
  const [shares, setShares] = useState<Share[]>([]);
  const [shareUserId, setShareUserId] = useState("");
  const [shareRole, setShareRole] = useState("editor");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<Share | null>(null);
  const [revokeBusy, setRevokeBusy] = useState(false);

  const titleRef = useRef(title);
  const contentRef = useRef(content);
  const skipAutosave = useRef(true);
  const saveInFlight = useRef(false);

  titleRef.current = title;
  contentRef.current = content;

  const save = useCallback(
    async (next?: { title?: string; content?: string }) => {
      if (!canWrite || saveInFlight.current) return;
      saveInFlight.current = true;
      setStatus("saving");
      try {
        const res = await fetch(`/api/documents/${documentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: next?.title ?? titleRef.current,
            content: next?.content ?? contentRef.current,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStatus("error");
          toast.error(data.error || "Save failed");
          return;
        }
        setStatus("saved");
        window.setTimeout(() => setStatus("idle"), 1600);
      } catch {
        setStatus("error");
        toast.error("Network error while saving");
      } finally {
        saveInFlight.current = false;
      }
    },
    [canWrite, documentId, toast]
  );

  useEffect(() => {
    if (!canWrite) return;
    if (skipAutosave.current) {
      skipAutosave.current = false;
      return;
    }
    const t = window.setTimeout(() => {
      void save();
    }, 1200);
    return () => window.clearTimeout(t);
  }, [title, content, canWrite, save]);

  async function openShare() {
    setShareOpen(true);
    setShareLoading(true);
    try {
      const [uRes, sRes] = await Promise.all([
        fetch("/api/users"),
        fetch(`/api/documents/${documentId}/share`),
      ]);
      if (uRes.ok) {
        const data = await uRes.json();
        setUsers(data.users || []);
        if (data.users?.[0]) setShareUserId(data.users[0].id);
      } else {
        toast.error("Could not load people to share with");
      }
      if (sRes.ok) {
        const data = await sRes.json();
        setShares(data.shares || []);
      }
    } finally {
      setShareLoading(false);
    }
  }

  async function grantShare() {
    if (!shareUserId) return;
    setGrantBusy(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: shareUserId, role: shareRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Share failed");
        return;
      }
      setShares((prev) => {
        const rest = prev.filter((s) => s.user?.id !== data.share.user?.id);
        return [...rest, data.share];
      });
      toast.success("Access granted");
    } finally {
      setGrantBusy(false);
    }
  }

  async function confirmRevoke() {
    if (!revokeTarget?.user?.id) return;
    setRevokeBusy(true);
    try {
      const res = await fetch(
        `/api/documents/${documentId}/share?userId=${revokeTarget.user.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        toast.error("Could not revoke access");
        return;
      }
      setShares((prev) =>
        prev.filter((s) => s.user?.id !== revokeTarget.user?.id)
      );
      toast.success("Access revoked");
      setRevokeTarget(null);
    } finally {
      setRevokeBusy(false);
    }
  }

  async function confirmDelete() {
    setDeleteBusy(true);
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Could not delete document");
        return;
      }
      toast.success("Document deleted");
      router.push("/dashboard");
    } finally {
      setDeleteBusy(false);
    }
  }

  const statusBadge =
    status === "saving" ? (
      <Badge tone="info" className="animate-status-in">
        Saving…
      </Badge>
    ) : status === "saved" ? (
      <Badge tone="success" className="animate-status-in">
        Saved
      </Badge>
    ) : status === "error" ? (
      <Badge tone="danger">Save failed</Badge>
    ) : canWrite ? (
      <Badge>Autosave on</Badge>
    ) : (
      <Badge tone="warning">View only</Badge>
    );

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-6">
      <div className="sticky top-0 z-20 -mx-4 mb-6 border-b border-[var(--border)] bg-[var(--background)]/95 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
          >
            ← Documents
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            {statusBadge}
            {canWrite && (
              <Button
                variant="secondary"
                onClick={() => save()}
                disabled={status === "saving"}
              >
                Save now
              </Button>
            )}
            {isOwner && (
              <>
                <Button variant="secondary" onClick={openShare}>
                  Share
                </Button>
                <Button variant="danger" onClick={() => setDeleteOpen(true)}>
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone={access === "owner" ? "info" : access === "editor" ? "success" : "warning"}>
          {access === "owner" ? "Owner" : access === "editor" ? "Editor" : "Viewer"}
        </Badge>
        <span className="text-xs text-[var(--muted)]">Owned by {ownerLabel}</span>
      </div>

      <input
        className="mb-5 w-full border-0 bg-transparent text-3xl font-semibold tracking-tight text-[var(--ink)] outline-none placeholder:text-stone-300 focus-visible:outline-none"
        value={title}
        disabled={!canWrite}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => {
          if (canWrite && title.trim()) void save({ title });
        }}
        placeholder="Document title"
        aria-label="Document title"
      />

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
        <RichEditor
          content={content}
          editable={canWrite}
          onChange={(html) => setContent(html)}
        />
      </div>

      <Modal
        open={shareOpen}
        title="Share document"
        onClose={() => setShareOpen(false)}
      >
        {shareLoading ? (
          <p className="text-sm text-[var(--muted)]">Loading people…</p>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-[var(--muted)]">
                Add people
              </p>
              {users.length === 0 ? (
                <p className="rounded-lg border border-dashed border-[var(--border)] px-3 py-4 text-sm text-[var(--muted)]">
                  No other demo users available.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {users.map((u) => {
                    const selected = shareUserId === u.id;
                    return (
                      <li key={u.id}>
                        <button
                          type="button"
                          onClick={() => setShareUserId(u.id)}
                          className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${selected
                              ? "border-[var(--ink)] bg-[var(--surface-muted)]"
                              : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-muted)]"
                            }`}
                        >
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${selected
                                ? "bg-[var(--ink)] text-white"
                                : "bg-[var(--surface-muted)] text-[var(--ink)]"
                              }`}
                          >
                            {u.name
                              .split(" ")
                              .map((p) => p[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-[var(--ink)]">
                              {u.name}
                            </span>
                            <span className="block truncate text-xs text-[var(--muted)]">
                              {u.email}
                            </span>
                          </span>
                          {selected ? (
                            <Badge tone="info">Selected</Badge>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-[var(--muted)]">
                Permission
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: "editor", label: "Editor", hint: "Can edit" },
                    { id: "viewer", label: "Viewer", hint: "Read only" },
                  ] as const
                ).map((role) => {
                  const active = shareRole === role.id;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setShareRole(role.id)}
                      className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${active
                          ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                          : "border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-muted)]"
                        }`}
                    >
                      <span className="block text-sm font-medium">
                        {role.label}
                      </span>
                      <span
                        className={`block text-xs ${active ? "text-white/70" : "text-[var(--muted)]"}`}
                      >
                        {role.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              className="w-full py-2.5"
              onClick={grantShare}
              loading={grantBusy}
              disabled={!shareUserId || users.length === 0}
            >
              {grantBusy ? "Granting…" : "Grant access"}
            </Button>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-[var(--muted)]">
                People with access
              </p>
              <ul className="space-y-1.5">
                {shares.length === 0 && (
                  <li className="rounded-lg border border-dashed border-[var(--border)] px-3 py-4 text-sm text-[var(--muted)]">
                    No collaborators yet.
                  </li>
                )}
                {shares.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--ink)]">
                        {s.user?.name || "Unknown"}
                      </p>
                      <p className="truncate text-xs text-[var(--muted)]">
                        {s.user?.email}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge
                        tone={s.role === "viewer" ? "warning" : "success"}
                      >
                        {s.role === "viewer" ? "Viewer" : "Editor"}
                      </Badge>
                      <Button
                        variant="secondary"
                        className="!px-2.5 !py-1 text-xs"
                        onClick={() => setRevokeTarget(s)}
                      >
                        Revoke
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete document?"
        body="This permanently removes the document and all sharing. This cannot be undone."
        confirmLabel="Delete permanently"
        danger
        busy={deleteBusy}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
      />

      <ConfirmDialog
        open={Boolean(revokeTarget)}
        title="Revoke access?"
        body={`Remove ${revokeTarget?.user?.name || "this person"}’s access to this document?`}
        confirmLabel="Revoke"
        danger
        busy={revokeBusy}
        onCancel={() => setRevokeTarget(null)}
        onConfirm={confirmRevoke}
      />
    </div>
  );
}
