import { NextResponse } from "next/server";
import { AuthError, ForbiddenError } from "./auth";

export function jsonError(err: unknown) {
  if (err instanceof AuthError || err instanceof ForbiddenError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error(err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
