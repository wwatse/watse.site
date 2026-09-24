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
      description: meta.description || ""
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
// Main
// -------------------------------------------------------------------------
function main() {
  const posts = loadPosts();
  updateHomepage(posts);
  const plural = posts.length === 1 ? "" : "s";
  console.log(`[build] ${posts.length} post${plural} written to homepage log`);
}

main();
