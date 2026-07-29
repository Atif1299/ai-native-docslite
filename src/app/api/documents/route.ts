import { NextRequest, NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import {
  createDocument,
  listOwnedDocuments,
  listSharedDocuments,
} from "@/lib/store";

export async function GET() {
  try {
    const user = await requireSessionUser();
    const [owned, shared] = await Promise.all([
      listOwnedDocuments(user.id),
      listSharedDocuments(user.id),
    ]);
    return NextResponse.json({ owned, shared });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireSessionUser();
    const body = await req.json().catch(() => ({}));
    const title =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim()
        : "Untitled document";

    const doc = await createDocument({
      title,
      content: "<p></p>",
      ownerId: user.id,
    });

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
