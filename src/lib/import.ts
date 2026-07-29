import { basename } from "path";

export function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Convert plain text or light markdown into TipTap-friendly HTML. */
export function importTextToHtml(raw: string, filename: string) {
  const isMd = filename.toLowerCase().endsWith(".md");
  const lines = raw.replaceAll("\r\n", "\n").split("\n");

  if (!isMd) {
    const body = lines
      .map((line) =>
        line.trim() === "" ? "<p></p>" : `<p>${escapeHtml(line)}</p>`
      )
      .join("");
    return body || "<p></p>";
  }

  const html: string[] = [];
  let inUl = false;
  let inOl = false;

  const closeLists = () => {
    if (inUl) {
      html.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      html.push("</ol>");
      inOl = false;
    }
  };

  for (const line of lines) {
    const h1 = /^#\s+(.+)/.exec(line);
    const h2 = /^##\s+(.+)/.exec(line);
    const h3 = /^###\s+(.+)/.exec(line);
    const ul = /^[-*]\s+(.+)/.exec(line);
    const ol = /^\d+\.\s+(.+)/.exec(line);

    if (h1) {
      closeLists();
      html.push(`<h1>${inlineMd(h1[1])}</h1>`);
      continue;
    }
    if (h2) {
      closeLists();
      html.push(`<h2>${inlineMd(h2[1])}</h2>`);
      continue;
    }
    if (h3) {
      closeLists();
      html.push(`<h3>${inlineMd(h3[1])}</h3>`);
      continue;
    }
    if (ul) {
      if (inOl) {
        html.push("</ol>");
        inOl = false;
      }
      if (!inUl) {
        html.push("<ul>");
        inUl = true;
      }
      html.push(`<li>${inlineMd(ul[1])}</li>`);
      continue;
    }
    if (ol) {
      if (inUl) {
        html.push("</ul>");
        inUl = false;
      }
      if (!inOl) {
        html.push("<ol>");
        inOl = true;
      }
      html.push(`<li>${inlineMd(ol[1])}</li>`);
      continue;
    }

    closeLists();
    if (line.trim() === "") {
      html.push("<p></p>");
    } else {
      html.push(`<p>${inlineMd(line)}</p>`);
    }
  }

  closeLists();
  return html.join("") || "<p></p>";
}

function inlineMd(text: string) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/_(.+?)_/g, "<em>$1</em>");
}

export function titleFromFilename(filename: string) {
  const base = basename(filename);
  const stem = base.replace(/\.(txt|md)$/i, "").trim();
  return stem || "Imported document";
}
