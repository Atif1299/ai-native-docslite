import { describe, expect, it } from "vitest";
import { resolveAccess } from "../src/lib/store";

describe("resolveAccess", () => {
  const doc = { ownerId: "alice" };
  const shares = [
    { userId: "bob", role: "editor" },
    { userId: "cara", role: "viewer" },
  ];

  it("returns owner for document owner", () => {
    expect(resolveAccess("alice", doc, shares)).toBe("owner");
  });

  it("returns editor for shared editor", () => {
    expect(resolveAccess("bob", doc, shares)).toBe("editor");
  });

  it("returns viewer for shared viewer", () => {
    expect(resolveAccess("cara", doc, shares)).toBe("viewer");
  });

  it("returns null when user has no access", () => {
    expect(resolveAccess("dave", doc, shares)).toBeNull();
  });

  it("returns null when document is missing", () => {
    expect(resolveAccess("alice", null, shares)).toBeNull();
  });
});
