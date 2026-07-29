import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

export type DbUser = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt?: string;
};

export type DbDocument = {
  id: string;
  title: string;
  content: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
};

export type DbShare = {
  id: string;
  documentId: string;
  userId: string;
  role: string;
  createdAt?: string;
};

function newId() {
  return randomUUID();
}

function client(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY are required");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function findUserByEmail(email: string) {
  const { data, error } = await client()
    .from("User")
    .select("*")
    .eq("email", email)
    .maybeSingle();
  if (error) throw error;
  return data as DbUser | null;
}

export async function findUserById(id: string) {
  const { data, error } = await client()
    .from("User")
    .select("id, email, name")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Pick<DbUser, "id" | "email" | "name"> | null;
}

export async function listOtherUsers(excludeId: string) {
  const { data, error } = await client()
    .from("User")
    .select("id, email, name")
    .neq("id", excludeId)
    .order("name");
  if (error) throw error;
  return (data || []) as Pick<DbUser, "id" | "email" | "name">[];
}

export async function listOwnedDocuments(ownerId: string) {
  const { data, error } = await client()
    .from("Document")
    .select("id, title, updatedAt, createdAt, ownerId")
    .eq("ownerId", ownerId)
    .order("updatedAt", { ascending: false });
  if (error) throw error;

  const owner = await findUserById(ownerId);
  return (data || []).map((d) => ({ ...d, owner }));
}

export async function listSharedDocuments(userId: string) {
  const { data, error } = await client()
    .from("DocumentShare")
    .select(
      "role, documentId, document:Document(id, title, updatedAt, createdAt, ownerId)"
    )
    .eq("userId", userId)
    .order("createdAt", { ascending: false });
  if (error) throw error;

  const rows = data || [];
  const out = [];
  for (const row of rows) {
    const doc = Array.isArray(row.document) ? row.document[0] : row.document;
    if (!doc) continue;
    const owner = await findUserById(doc.ownerId);
    out.push({ ...doc, owner, role: row.role });
  }
  return out;
}

export async function createDocument(input: {
  title: string;
  content?: string;
  ownerId: string;
}) {
  const now = new Date().toISOString();
  const row = {
    id: newId(),
    title: input.title,
    content: input.content ?? "<p></p>",
    ownerId: input.ownerId,
    createdAt: now,
    updatedAt: now,
  };
  const { data, error } = await client()
    .from("Document")
    .insert(row)
    .select("*")
    .single();
  if (error) throw error;
  return data as DbDocument;
}

export async function getDocument(id: string) {
  const { data, error } = await client()
    .from("Document")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as DbDocument | null;
}

export async function updateDocument(
  id: string,
  patch: { title?: string; content?: string }
) {
  const { data, error } = await client()
    .from("Document")
    .update({ ...patch, updatedAt: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as DbDocument;
}

export async function deleteDocument(id: string) {
  const { error } = await client().from("Document").delete().eq("id", id);
  if (error) throw error;
}

export async function listShares(documentId: string) {
  const { data, error } = await client()
    .from("DocumentShare")
    .select("id, role, userId, createdAt")
    .eq("documentId", documentId)
    .order("createdAt", { ascending: true });
  if (error) throw error;
  const rows = data || [];
  return Promise.all(
    rows.map(async (s) => ({
      ...s,
      user: await findUserById(s.userId),
    }))
  );
}

export async function upsertShare(input: {
  documentId: string;
  userId: string;
  role: string;
}) {
  const { data: existing, error: findErr } = await client()
    .from("DocumentShare")
    .select("id")
    .eq("documentId", input.documentId)
    .eq("userId", input.userId)
    .maybeSingle();
  if (findErr) throw findErr;

  if (existing?.id) {
    const { data, error } = await client()
      .from("DocumentShare")
      .update({ role: input.role })
      .eq("id", existing.id)
      .select("id, role, userId")
      .single();
    if (error) throw error;
    return { ...data, user: await findUserById(data.userId) };
  }

  const { data, error } = await client()
    .from("DocumentShare")
    .insert({
      id: newId(),
      documentId: input.documentId,
      userId: input.userId,
      role: input.role,
      createdAt: new Date().toISOString(),
    })
    .select("id, role, userId")
    .single();
  if (error) throw error;
  return { ...data, user: await findUserById(data.userId) };
}

export async function deleteShare(documentId: string, userId: string) {
  const { error } = await client()
    .from("DocumentShare")
    .delete()
    .eq("documentId", documentId)
    .eq("userId", userId);
  if (error) throw error;
}

export async function listSharesForDoc(documentId: string) {
  const { data, error } = await client()
    .from("DocumentShare")
    .select("*")
    .eq("documentId", documentId);
  if (error) throw error;
  return (data || []) as DbShare[];
}

/** Pure access check used by API auth + unit tests. */
export function resolveAccess(
  userId: string,
  doc: { ownerId: string } | null,
  shares: { userId: string; role: string }[]
): "owner" | "editor" | "viewer" | null {
  if (!doc) return null;
  if (doc.ownerId === userId) return "owner";
  const share = shares.find((s) => s.userId === userId);
  if (!share) return null;
  return share.role === "viewer" ? "viewer" : "editor";
}

export async function ensureSeedUsers() {
  const hash = "$2b$10$4K499snaO7NsV2OvG2NNduUfBItVnd3JM695pEGj8uUq7znQZN09e";
  const seeds = [
    {
      id: "seed_alice_owner_001",
      email: "alice@ajaia.demo",
      name: "Alice Owner",
      passwordHash: hash,
    },
    {
      id: "seed_bob_collab_001",
      email: "bob@ajaia.demo",
      name: "Bob Collaborator",
      passwordHash: hash,
    },
  ];

  for (const u of seeds) {
    const existing = await findUserByEmail(u.email);
    if (!existing) {
      const { error } = await client()
        .from("User")
        .insert({ ...u, createdAt: new Date().toISOString() });
      if (error) throw error;
    }
  }

  const alice = await findUserByEmail("alice@ajaia.demo");
  const bob = await findUserByEmail("bob@ajaia.demo");
  if (!alice || !bob) return;

  const { data: welcome } = await client()
    .from("Document")
    .select("id")
    .eq("ownerId", alice.id)
    .eq("title", "Welcome to DocsLite")
    .maybeSingle();

  if (!welcome) {
    const doc = await createDocument({
      title: "Welcome to DocsLite",
      content:
        "<h1>Welcome</h1><p>This is a seeded document. Try <strong>bold</strong>, <em>italic</em>, and lists.</p><ul><li>Create documents</li><li>Share with Bob</li><li>Import .txt or .md</li></ul>",
      ownerId: alice.id,
    });
    await upsertShare({
      documentId: doc.id,
      userId: bob.id,
      role: "editor",
    });
  }
}
