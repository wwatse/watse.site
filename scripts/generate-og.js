#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const POSTS_DIR = path.join(ROOT, "content", "posts");
const TEMPLATE_PATH = path.join(__dirname, "og-template.html");
const OUTPUT_DIR = path.join(ROOT, "assets", "og");
const VIEWPORT = { width: 1200, height: 630 };

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function parseTitle(markdown) {
    const match = markdown.match(/^---\s*\n[\s\S]*?^title:\s*(.+?)\s*$[\s\S]*?^---\s*$/m);
    if (!match || !match[1].trim()) {
        throw new Error("Markdown file is missing a title in its front matter");
    }
    return match[1].trim().replace(/^['"]|['"]$/g, "");
}

function slugify(title) {
    return title
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "untitled";
}

function findMarkdownFiles(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            return findMarkdownFiles(entryPath);
        }
        return entry.isFile() && entry.name.endsWith(".md") ? [entryPath] : [];
    });
}

async function createImage(page, template, title, outputPath) {
    const html = template.replace("<!--TITLE-->", escapeHtml(title));
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: outputPath, type: "png" });
}

async function main() {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const template = fs.readFileSync(TEMPLATE_PATH, "utf8");
    const posts = findMarkdownFiles(POSTS_DIR);
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });
    const usedSlugs = new Set();

    try {
        await createImage(page, template, "kelvin watse", path.join(OUTPUT_DIR, "default-og.png"));

        for (const postPath of posts) {
            const title = parseTitle(fs.readFileSync(postPath, "utf8"));
            const baseSlug = slugify(title);
            let slug = baseSlug;
            let suffix = 2;
            while (usedSlugs.has(slug)) {
                slug = `${baseSlug}-${suffix}`;
                suffix += 1;
            }
            usedSlugs.add(slug);
            await createImage(page, template, title, path.join(OUTPUT_DIR, `${slug}.png`));
        }
    } finally {
        await browser.close();
    }

    console.log(`Generated ${posts.length + 1} OG images in ${path.relative(ROOT, OUTPUT_DIR)}/`);
}

main().catch((error) => {
    console.error(error.stack || error);
    process.exitCode = 1;
});
