import { NextRequest, NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { importTextToHtml, titleFromFilename } from "@/lib/import";
import { createDocument } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const user = await requireSessionUser();
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const name = file.name || "import.txt";
    const lower = name.toLowerCase();
    if (!lower.endsWith(".txt") && !lower.endsWith(".md")) {
      return NextResponse.json(
        { error: "Only .txt and .md files are supported" },
        { status: 400 }
      );
    }

    if (file.size > 1_000_000) {
      return NextResponse.json(
        { error: "File must be under 1MB" },
        { status: 400 }
      );
    }

    const raw = await file.text();
    const content = importTextToHtml(raw, name);
    const title = titleFromFilename(name);

    const document = await createDocument({
      title,
      content,
      ownerId: user.id,
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
