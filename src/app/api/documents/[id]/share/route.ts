import { NextRequest, NextResponse } from "next/server";
import { requireDocAccess, requireSessionUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { deleteShare, findUserById, listShares, upsertShare } from "@/lib/store";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireSessionUser();
    const { id } = await ctx.params;
    const { access } = await requireDocAccess(user.id, id);
    if (access !== "owner") {
      return NextResponse.json(
        { error: "Only the owner can view shares" },
        { status: 403 }
      );
    }

    const shares = await listShares(id);
    return NextResponse.json({ shares });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireSessionUser();
    const { id } = await ctx.params;
    const { access } = await requireDocAccess(user.id, id);
    if (access !== "owner") {
      return NextResponse.json(
        { error: "Only the owner can share a document" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const userId = String(body.userId || "");
    const role = body.role === "viewer" ? "viewer" : "editor";

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    if (userId === user.id) {
      return NextResponse.json(
        { error: "Cannot share with yourself" },
        { status: 400 }
      );
    }

    const target = await findUserById(userId);
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const share = await upsertShare({ documentId: id, userId, role });
    return NextResponse.json({ share }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireSessionUser();
    const { id } = await ctx.params;
    const { access } = await requireDocAccess(user.id, id);
    if (access !== "owner") {
      return NextResponse.json(
        { error: "Only the owner can revoke shares" },
        { status: 403 }
      );
    }

    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    await deleteShare(id, userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
