#!/usr/bin/env node
"use strict";

/**
 * Build script.
 *
 * Reads content/posts/manifest.json, extracts frontmatter from each post,
 * and writes the log section of index.html between two marker comments:
 *
 *   <!-- BUILD:log:start -->
 *   ...generated items...
 *   <!-- BUILD:log:end -->
 *
 * Idempotent: running twice produces the same output. Only the content
 * between the markers is touched.
 *
 * Zero dependencies. Node built-ins only.
 *
 * Usage:  node scripts/build.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const MANIFEST_PATH = path.join(ROOT, "content", "posts", "manifest.json");
const POSTS_DIR = path.join(ROOT, "content", "posts");
const HOMEPAGE = path.join(ROOT, "index.html");

const START_MARKER = "<!-- BUILD:log:start -->";
const END_MARKER = "<!-- BUILD:log:end -->";

// -------------------------------------------------------------------------
// Frontmatter parsing — mirrors js/content-engine/parser.js rules:
// opening --- on line 1, closing --- on a later line, flat key: value,
// every value kept as a string with leading whitespace stripped.
// -------------------------------------------------------------------------
function parseFrontmatter(raw) {
  const metadata = {};
  const lines = String(raw).split(/\r?\n/);
  if (lines.length === 0 || lines[0].trim() !== "---") {
    return metadata;
  }
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === "---") break;
    const sep = lines[i].indexOf(":");
    if (sep === -1) continue;
    const key = lines[i].slice(0, sep).trim();
    if (!key) continue;
    const value = lines[i].slice(sep + 1).replace(/^\s+/, "");
    metadata[key] = value;
  }
  return metadata;
}

function escapeHtml(text) {
  return String(text == null ? "" : text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// -------------------------------------------------------------------------
// Loading
// -------------------------------------------------------------------------
function readManifest() {
  const text = fs.readFileSync(MANIFEST_PATH, "utf8");
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) {
    throw new Error("manifest.json must be a JSON array");
  }
  return parsed;
}

function loadPosts() {
  const manifest = readManifest();
  const posts = [];

  for (const entry of manifest) {
    const slug = typeof entry.slug === "string" ? entry.slug : "";
    if (!slug) continue;

    const rel = typeof entry.entry === "string" && entry.entry
      ? entry.entry
      : slug + "/index.md";
    const full = path.join(POSTS_DIR, rel);

    let raw = "";
    try {
      raw = fs.readFileSync(full, "utf8");
    } catch (error) {
      console.warn(`[build] skipping "${slug}": ${error.message}`);
      continue;
    }

    const meta = parseFrontmatter(raw);
    posts.push({
      slug: slug,
      title: meta.title || slug,
      date: meta.date || "",
      description: meta.description || "",
      entry: rel
    });
  }

  // Sort descending by date (newest first)
  posts.sort((a, b) => {
    const at = a.date ? new Date(a.date).getTime() : 0;
    const bt = b.date ? new Date(b.date).getTime() : 0;
    return bt - at;
  });

  return posts;
}

// -------------------------------------------------------------------------
// HTML generation
// -------------------------------------------------------------------------
function buildLogItem(post) {
  return `    <div class="item item--log">
      <div class="item-header">
        <span class="log-date">${escapeHtml(post.date)}</span>
        <span class="item-title level-3"><a href="/post/${escapeHtml(post.slug)}/">${escapeHtml(post.title)}</a></span>
      </div>
      <div class="level-4">${escapeHtml(post.description)}</div>
    </div>`;
}

function buildLogSection(posts) {
  if (posts.length === 0) {
    return `    <p class="level-4">no posts yet.</p>`;
  }
  return posts.map(buildLogItem).join("\n\n");
}

// -------------------------------------------------------------------------
// Homepage rewriting
// -------------------------------------------------------------------------
function updateHomepage(posts) {
  const src = fs.readFileSync(HOMEPAGE, "utf8");

  const startIdx = src.indexOf(START_MARKER);
  const endIdx = src.indexOf(END_MARKER);

  if (startIdx === -1) {
    throw new Error(`start marker "${START_MARKER}" not found in index.html`);
  }
  if (endIdx === -1) {
    throw new Error(`end marker "${END_MARKER}" not found in index.html`);
  }
  if (endIdx <= startIdx) {
    throw new Error("end marker appears before start marker");
  }

  const before = src.slice(0, startIdx + START_MARKER.length);
  const after = src.slice(endIdx);
  const section = buildLogSection(posts);

  // Two-space indent for the end marker, matching the start marker
  const newHtml = `${before}\n${section}\n  ${after}`;
  fs.writeFileSync(HOMEPAGE, newHtml, "utf8");
}

// -------------------------------------------------------------------------
// Markdown rendering (port of lib/markdown-renderer.js, Node-flavored)
// -------------------------------------------------------------------------
function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function renderMarkdown(markdown) {
  if (typeof markdown !== "string") return "";
  const normalized = markdown.trim();
  if (!normalized) return "";

  const paragraphs = normalized.split(/\n{2,}/).filter(Boolean);

  return paragraphs
    .map((paragraph) => {
      const trimmed = paragraph.trim();

      // ATX headings with slugged IDs
      if (/^#{1,6}\s/.test(trimmed)) {
        const level = trimmed.match(/^(#{1,6})/)[1].length;
        const text = trimmed.replace(/^#{1,6}\s/, "");
        const slug = slugify(text);
        const idAttr = slug ? ` id="${slug}"` : "";
        return `<h${level}${idAttr}>${text}</h${level}>`;
      }

      // Fenced code block
      if (/^```/.test(trimmed)) {
        const code = trimmed.replace(/^```[\w-]*\s*/, "").replace(/```$/, "");
        return `<pre><code>${code}</code></pre>`;
      }

      // Unordered list
      if (/^[-*+]\s/.test(trimmed)) {
        const items = trimmed
          .split(/\n/)
          .filter((line) => /^[-*+]\s/.test(line.trim()))
          .map((line) => `<li>${line.replace(/^[-*+]\s/, "")}</li>`);
        return `<ul>${items.join("")}</ul>`;
      }

      // Paragraph with inline formatting
      const html = trimmed
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

      return `<p>${html}</p>`;
    })
    .join("");
}

// Extracts the body from a raw markdown file, stripping the frontmatter
// block. Mirrors the parser's rule: `---` on line 1, `---` later.
function extractBody(raw) {
  const lines = String(raw).split(/\r?\n/);
  if (lines.length === 0 || lines[0].trim() !== "---") {
    return raw.trim();
  }
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === "---") {
      return lines.slice(i + 1).join("\n").trim();
    }
  }
  return raw.trim();
}

// -------------------------------------------------------------------------
// Post page generation
// -------------------------------------------------------------------------
function buildPostPage(post) {
  const title = escapeHtml(post.title);
  const date = escapeHtml(post.date);
  const renderedBody = renderMarkdown(post.body);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — k. watse</title>
<link rel="stylesheet" href="/css/style.css">
</head>
<body>

  <a href="/" class="back">← back</a>

  <header class="post-header">
    <h1 class="post-title level-2">${title}</h1>
    <p class="post-date">${date}</p>
  </header>

  <article class="post-body">
${renderedBody}
  </article>

  <footer class="post-footer">
    filed under log &middot; ${date}
  </footer>

</body>
</html>
`;
}

function generatePostPages(posts) {
  let written = 0;

  for (const post of posts) {
    if (!post.slug) continue;

    const rel = post.entry || post.slug + "/index.md";
    const full = path.join(POSTS_DIR, rel);

    let raw = "";
    try {
      raw = fs.readFileSync(full, "utf8");
    } catch (error) {
      console.warn(`[build] skipping "${post.slug}": ${error.message}`);
      continue;
    }

    post.body = extractBody(raw);

    const dir = path.join(ROOT, "post", post.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), buildPostPage(post), "utf8");
    written += 1;
  }

  return written;
}

// -------------------------------------------------------------------------
// Main
// -------------------------------------------------------------------------
function main() {
  const posts = loadPosts();
  updateHomepage(posts);
  const pagesWritten = generatePostPages(posts);
  const plural = posts.length === 1 ? "" : "s";
  const pageWord = pagesWritten === 1 ? "page" : "pages";
  console.log(`[build] ${posts.length} post${plural} written to homepage log`);
  console.log(`[build] ${pagesWritten} ${pageWord} written to /post/`);
}

main();
