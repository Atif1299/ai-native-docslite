import { describe, expect, it } from "vitest";
import { importTextToHtml, titleFromFilename } from "../src/lib/import";

describe("importTextToHtml", () => {
  it("converts plain text lines to paragraphs", () => {
    const html = importTextToHtml("Hello\nWorld", "notes.txt");
    expect(html).toContain("<p>Hello</p>");
    expect(html).toContain("<p>World</p>");
  });

  it("parses markdown headings and lists", () => {
    const md = "# Title\n\n- one\n- two\n\n1. first";
    const html = importTextToHtml(md, "guide.md");
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>one</li>");
    expect(html).toContain("<ol>");
    expect(html).toContain("<li>first</li>");
  });

  it("escapes HTML in imported content", () => {
    const html = importTextToHtml("<script>alert(1)</script>", "x.txt");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("titleFromFilename", () => {
  it("strips extension", () => {
    expect(titleFromFilename("Meeting Notes.md")).toBe("Meeting Notes");
  });
});
