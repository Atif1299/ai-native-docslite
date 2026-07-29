import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

export default async function HomePage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
          DocsLite
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--ink)]">
          Write together, simply
        </h1>
        <p className="mt-2 mb-6 text-sm leading-relaxed text-[var(--muted)]">
          Create, edit, and share documents with clear ownership and lasting
          drafts.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
