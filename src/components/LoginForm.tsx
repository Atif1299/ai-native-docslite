"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/Button";

const DEMOS = [
  {
    label: "Alice · owner",
    email: "alice@ajaia.demo",
    password: "password123",
  },
  {
    label: "Bob · collaborator",
    email: "bob@ajaia.demo",
    password: "password123",
  },
] as const;

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState<string>(DEMOS[0].email);
  const [password, setPassword] = useState<string>(DEMOS[0].password);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--ink)]">
          Email
        </label>
        <input
          className="input-field"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          autoComplete="username"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--ink)]">
          Password
        </label>
        <input
          className="input-field"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
          autoComplete="current-password"
        />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full py-2.5" loading={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </Button>
      <div>
        <p className="mb-2 text-xs font-medium text-[var(--muted)]">
          Demo accounts
        </p>
        <div className="flex flex-wrap gap-2">
          {DEMOS.map((d) => {
            const active = email === d.email;
            return (
              <button
                key={d.email}
                type="button"
                onClick={() => {
                  setEmail(d.email);
                  setPassword(d.password);
                  setError("");
                }}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${active
                    ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                    : "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--ink)] hover:border-[var(--ink)]/30"
                  }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </div>
    </form>
  );
}
