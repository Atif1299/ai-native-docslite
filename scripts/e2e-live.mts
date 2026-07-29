/**
 * Live E2E smoke against production DocsLite.
 * Run: npx tsx scripts/e2e-live.mts
 */
const BASE = process.env.LIVE_URL || "https://app-blush-seven-53.vercel.app";

type Jar = Map<string, string>;

function parseSetCookie(headers: Headers, jar: Jar) {
  const raw = headers.getSetCookie?.() || [];
  for (const c of raw) {
    const [pair] = c.split(";");
    const eq = pair.indexOf("=");
    if (eq > 0) jar.set(pair.slice(0, eq), pair.slice(eq + 1));
  }
  // Node fetch fallback
  const single = headers.get("set-cookie");
  if (single && raw.length === 0) {
    const [pair] = single.split(";");
    const eq = pair.indexOf("=");
    if (eq > 0) jar.set(pair.slice(0, eq), pair.slice(eq + 1));
  }
}

function cookieHeader(jar: Jar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function api(
  jar: Jar,
  path: string,
  init: RequestInit = {}
): Promise<{ status: number; json: any; headers: Headers }> {
  const headers = new Headers(init.headers);
  if (jar.size) headers.set("cookie", cookieHeader(jar));
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  parseSetCookie(res.headers, jar);
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json, headers: res.headers };
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

async function login(email: string, password: string) {
  const jar: Jar = new Map();
  const { status, json } = await api(jar, "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  assert(status === 200, `login failed for ${email}: ${status} ${JSON.stringify(json)}`);
  assert(json?.user?.email === email, "login email mismatch");
  return jar;
}

async function main() {
  console.log("E2E against", BASE);

  // Home page
  const home = await fetch(BASE);
  assert(home.ok, `home not ok: ${home.status}`);

  const alice = await login("alice@ajaia.demo", "password123");
  const bob = await login("bob@ajaia.demo", "password123");

  // Create
  const created = await api(alice, "/api/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "E2E Validation Doc" }),
  });
  assert(created.status === 201, `create failed: ${JSON.stringify(created.json)}`);
  const docId = created.json.document.id as string;

  // Rename + rich content
  const patched = await api(alice, `/api/documents/${docId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "E2E Renamed Doc",
      content: "<h1>Hello</h1><p><strong>bold</strong> <em>italic</em></p><ul><li>one</li></ul>",
    }),
  });
  assert(patched.status === 200, `patch failed: ${JSON.stringify(patched.json)}`);
  assert(patched.json.document.title === "E2E Renamed Doc", "title not renamed");

  // Reopen
  const got = await api(alice, `/api/documents/${docId}`);
  assert(got.status === 200, "reopen failed");
  assert(got.json.document.content.includes("<strong>bold</strong>"), "formatting lost");

  // Bob cannot read before share
  const denied = await api(bob, `/api/documents/${docId}`);
  assert(denied.status === 403 || denied.status === 404 || denied.json?.error, "bob should not access unshared doc");

  // Users list + share
  const users = await api(alice, "/api/users");
  assert(users.status === 200, "users failed");
  const bobUser = (users.json.users || []).find((u: any) => u.email === "bob@ajaia.demo");
  assert(bobUser, "bob user missing");

  const shared = await api(alice, `/api/documents/${docId}/share`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: bobUser.id, role: "editor" }),
  });
  assert(shared.status === 201, `share failed: ${JSON.stringify(shared.json)}`);

  // Bob sees in shared list and can edit
  const bobList = await api(bob, "/api/documents");
  assert(bobList.status === 200, "bob list failed");
  assert(
    (bobList.json.shared || []).some((d: any) => d.id === docId),
    "doc missing from bob shared list"
  );

  const bobEdit = await api(bob, `/api/documents/${docId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: "<p>Bob edited</p>" }),
  });
  assert(bobEdit.status === 200, `bob edit failed: ${JSON.stringify(bobEdit.json)}`);

  // Import md
  const md = "# Imported\n\n- a\n- b\n";
  const form = new FormData();
  form.append(
    "file",
    new Blob([md], { type: "text/markdown" }),
    "e2e-import.md"
  );
  const imported = await api(alice, "/api/documents/import", {
    method: "POST",
    body: form,
  });
  assert(imported.status === 201, `import failed: ${JSON.stringify(imported.json)}`);
  assert(imported.json.document.title === "e2e-import", "import title wrong");
  assert(
    imported.json.document.content.includes("<h1>Imported</h1>"),
    "import html missing heading"
  );

  // Viewer cannot write
  await api(alice, `/api/documents/${docId}/share`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: bobUser.id, role: "viewer" }),
  });
  const viewerWrite = await api(bob, `/api/documents/${docId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: "<p>nope</p>" }),
  });
  assert(viewerWrite.status === 403, `viewer write should 403, got ${viewerWrite.status}`);

  // Cleanup: delete created docs as owner
  const del = await api(alice, `/api/documents/${docId}`, { method: "DELETE" });
  assert(del.status === 200, "delete failed");
  const delImport = await api(alice, `/api/documents/${imported.json.document.id}`, {
    method: "DELETE",
  });
  assert(delImport.status === 200, "delete import failed");

  console.log("E2E OK — create/rename/edit/share/import/viewer/delete");
}

main().catch((err) => {
  console.error("E2E FAILED", err);
  process.exit(1);
});
