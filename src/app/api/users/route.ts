import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { listOtherUsers } from "@/lib/store";

export async function GET() {
  try {
    const me = await requireSessionUser();
    const users = await listOtherUsers(me.id);
    return NextResponse.json({ users });
  } catch (err) {
    return jsonError(err);
  }
}
