#!/usr/bin/env node
"use strict";

/**
 * Static RSS 2.0 generator.
 *
 * Reads content/posts/manifest.json, loads each post's index.md, extracts
 * frontmatter with the same rules as js/content-engine/parser.js (flat
 * key:value, every value is a string, no type coercion), sorts by date
 * descending, and writes rss.xml to the project root.
 *
 * Zero dependencies. Node built-ins only.
 *
 * Usage:  node scripts/generate-rss.js
 */

const fs = require("fs");
const path = require("path");

// -------------------------------------------------------------------------
// Config
// -------------------------------------------------------------------------

const SITE_URL = "https://watse.me";
const CHANNEL_TITLE = "Kelvin Watse";
const CHANNEL_LINK = SITE_URL;
const CHANNEL_DESCRIPTION = "The personal website and digital portfolio of Kelvin Watse.";
const CHANNEL_LANGUAGE = "en-us";

const ROOT = path.resolve(__dirname, "..");
const MANIFEST_PATH = path.join(ROOT, "content", "posts", "manifest.json");
const POSTS_DIR = path.join(ROOT, "content", "posts");
const OUTPUT_PATH = path.join(ROOT, "rss.xml");

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------

function readManifest() {
  const text = fs.readFileSync(MANIFEST_PATH, "utf8");
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) {
    throw new Error("manifest.json must be a JSON array of { slug, entry } objects");
  }
  return parsed;
}

// Mirrors js/content-engine/parser.js: opening --- on line 1, closing --- on
// a later line, every value kept as a string with leading whitespace stripped.
function parseFrontmatter(raw) {
  const metadata = {};
  const lines = String(raw).split(/\r?\n/);
  if (lines.length === 0 || lines[0].trim() !== "---") {
    return metadata;
  }
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === "---") {
      break;
    }
    const separatorIndex = lines[i].indexOf(":");
    if (separatorIndex === -1) {
      continue;
    }
    const key = lines[i].slice(0, separatorIndex).trim();
    if (!key) {
      continue;
    }
    const value = lines[i].slice(separatorIndex + 1).replace(/^\s+/, "");
    metadata[key] = value;
  }
  return metadata;
}

// Returns a plain-text excerpt of the post body, suitable for RSS when the
// frontmatter omits a description. Frontmatter is stripped first, then
// Markdown syntax is roughly neutralized, and the result is truncated at a
// word boundary near 200 characters.
function bodyExcerpt(raw) {
  const lines = String(raw).split(/\r?\n/);
  let start = 0;
  if (lines.length > 0 && lines[0].trim() === "---") {
    for (let i = 1; i < lines.length; i += 1) {
      if (lines[i].trim() === "---") {
        start = i + 1;
        break;
      }
    }
  }
  const body = lines.slice(start).join("\n").trim();
  if (!body) return "";
  const plain = body
    .replace(/^#{1,6}\s+/gm, "")           // heading markers
    .replace(/[*_`>]/g, "")                  // emphasis, code, quote markers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")   // links -> text
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= 200) return plain;
  const cut = plain.slice(0, 200);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 120 ? cut.slice(0, lastSpace) : cut) + "\u2026";
}

function escapeXml(text) {
  return String(text == null ? "" : text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Date.prototype.toUTCString() emits an RFC-822 / RFC-1123 compliant string
// (e.g. "Mon, 12 Jul 2026 00:00:00 GMT"), which is what RSS 2.0 requires for
// <pubDate>. Unparseable dates fall back to the Unix epoch so the feed stays
// valid rather than emitting "Invalid Date".
function toRfc822(isoDate) {
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) {
    return new Date(0).toUTCString();
  }
  return d.toUTCString();
}

// -------------------------------------------------------------------------
// Loading
// -------------------------------------------------------------------------

function loadPost(entry) {
  const slug = typeof entry.slug === "string" ? entry.slug : "";
  const rel = typeof entry.entry === "string" && entry.entry ? entry.entry : slug + "/index.md";
  const full = path.join(POSTS_DIR, rel);

  let raw = "";
  try {
    raw = fs.readFileSync(full, "utf8");
  } catch (error) {
    console.warn('[rss] skipping "' + slug + '": ' + error.message);
    return null;
  }

  const meta = parseFrontmatter(raw);
  const title = meta.title || slug || "(untitled)";
  return {
    slug: slug,
    title: title,
    date: meta.date || "",
    // Prefer the frontmatter description. If omitted, fall back to the first
    // ~200 chars of the post body, then to the title. This lets new posts
    // skip `description:` entirely without breaking RSS.
    description: meta.description || bodyExcerpt(raw) || title
  };
}

// -------------------------------------------------------------------------
// XML construction
// -------------------------------------------------------------------------

function buildItem(post) {
  const link = SITE_URL + "/post/" + encodeURIComponent(post.slug) + "/";
  const pubDate = toRfc822(post.date);

  return [
    "    <item>",
    "      <title>" + escapeXml(post.title) + "</title>",
    "      <link>" + escapeXml(link) + "</link>",
    '      <guid isPermaLink="true">' + escapeXml(link) + "</guid>",
    "      <pubDate>" + escapeXml(pubDate) + "</pubDate>",
    "      <description>" + escapeXml(post.description) + "</description>",
    "    </item>"
  ].join("\n");
}

function buildFeed(posts) {
  const lastBuildDate = new Date().toUTCString();
  const itemsXml = posts.map(buildItem).join("\n");

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "  <channel>",
    "    <title>" + escapeXml(CHANNEL_TITLE) + "</title>",
    "    <link>" + escapeXml(CHANNEL_LINK) + "</link>",
    "    <description>" + escapeXml(CHANNEL_DESCRIPTION) + "</description>",
    "    <language>" + CHANNEL_LANGUAGE + "</language>",
    "    <lastBuildDate>" + escapeXml(lastBuildDate) + "</lastBuildDate>"
  ];

  if (itemsXml) {
    lines.push(itemsXml);
  }

  lines.push("  </channel>");
  lines.push("</rss>");
  lines.push("");
  return lines.join("\n");
}

// -------------------------------------------------------------------------
// Main
// -------------------------------------------------------------------------

function main() {
  let manifest;
  try {
    manifest = readManifest();
  } catch (error) {
    console.error("[rss] failed to read manifest: " + error.message);
    process.exit(1);
  }

  const posts = manifest
    .map(loadPost)
    .filter(Boolean)
    .sort((a, b) => {
      const aT = a.date ? new Date(a.date).getTime() : 0;
      const bT = b.date ? new Date(b.date).getTime() : 0;
      return bT - aT;
    });

  const xml = buildFeed(posts);
  fs.writeFileSync(OUTPUT_PATH, xml, "utf8");

  console.log("[rss] wrote " + OUTPUT_PATH);
  if (posts.length > 0) {
    const newest = posts[0];
    const oldest = posts[posts.length - 1];
    console.log("[rss] " + posts.length + " items");
    console.log("[rss] newest: " + newest.date + "  " + newest.title);
    console.log("[rss] oldest: " + oldest.date + "  " + oldest.title);
  } else {
    console.log("[rss] 0 items (empty feed)");
  }
}

main();
