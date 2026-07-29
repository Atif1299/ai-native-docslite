import { NextRequest, NextResponse } from "next/server";
import { requireDocAccess, requireSessionUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { deleteDocument, updateDocument } from "@/lib/store";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireSessionUser();
    const { id } = await ctx.params;
    const { doc, access } = await requireDocAccess(user.id, id);

    return NextResponse.json({
      document: {
        id: doc.id,
        title: doc.title,
        content: doc.content,
        ownerId: doc.ownerId,
        updatedAt: doc.updatedAt,
        createdAt: doc.createdAt,
      },
      access,
    });
  } catch (err) {
    return jsonError(err);
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireSessionUser();
    const { id } = await ctx.params;
    await requireDocAccess(user.id, id, true);

    const body = await req.json();
    const data: { title?: string; content?: string } = {};

    if (typeof body.title === "string") {
      const t = body.title.trim();
      if (!t) {
        return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
      }
      data.title = t.slice(0, 200);
    }
    if (typeof body.content === "string") {
      data.content = body.content;
    }

    if (!Object.keys(data).length) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const document = await updateDocument(id, data);
    return NextResponse.json({ document });
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireSessionUser();
    const { id } = await ctx.params;
    const { access } = await requireDocAccess(user.id, id);
    if (access !== "owner") {
      return NextResponse.json(
        { error: "Only the owner can delete a document" },
        { status: 403 }
      );
    }
    await deleteDocument(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
