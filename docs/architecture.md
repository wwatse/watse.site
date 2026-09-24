# Build architecture

A short explanation of how the site is structured and how content becomes
pages. This replaces the older content-engine.md, which described a
runtime content engine that has since been retired.

## What the site is

- Static HTML, one stylesheet, two font files. No JavaScript on any page.
- Three kinds of pages:
  - index.html - homepage with bio, works, log
  - post/<slug>/index.html - one directory per post, generated from markdown
  - 404.html - not-found page
- One PDF (watse.pdf) served directly, one RSS feed (rss.xml).

## What gets generated

Three things come out of a build, all from the same source:

    Output                        Source
    ---------------------------   ------------------------------------------
    index.html (log section)      manifest.json + each post's frontmatter
    post/<slug>/index.html        each post's markdown file
    rss.xml                       same manifest, same frontmatter

Everything else - bio, works, footer, 404 - is hand-written.

## How generation works

scripts/build.js is the single build script. It:

1. Reads content/posts/manifest.json.
2. For each entry, reads the markdown file and extracts frontmatter
   (flat key: value pairs between --- lines).
3. Regenerates the log section of index.html between two marker comments:

       <!-- BUILD:log:start -->
       ...
       <!-- BUILD:log:end -->

4. Generates a full post/<slug>/index.html for each post, rendering the
   markdown body to HTML.
5. Writes everything back to disk.

scripts/generate-rss.js reads the same manifest and writes rss.xml.

Both scripts are idempotent. Running them twice produces identical output,
so they are safe to run on every commit.

## Why no runtime engine

An earlier version of the site loaded a runtime content engine in the
browser: it fetched the manifest and markdown files, then built the DOM
with JavaScript. That worked, but had downsides:

- Slower first paint. Every page required a network round-trip before the
  log or post body would appear.
- JavaScript dependency. If scripts failed, the content never rendered.
- No reader-mode support. Browsers' built-in reader modes need static,
  semantic HTML. A JS-rendered page does not offer it.
- More code. Five engine modules and a page controller, roughly 600 lines,
  for a site with a handful of posts.

Generating at build time solves all four. The reader gets plain HTML, the
author still writes markdown, and the site has no runtime dependency on
JavaScript at all.

## Post format

Posts live at content/posts/<slug>/index.md:

    ---
    title: your post title
    date: 2026-09-20
    description: one line shown on the homepage log and in RSS
    ---

    Body content in markdown. Headings, paragraphs, lists, links, code.

Frontmatter fields:

- title - used in the log list and as the post page's heading
- date - ISO format, controls sort order and RSS pubDate
- description - one-line summary. If omitted, the RSS generator falls back
  to the first ~200 characters of the post body.

## Manifest

content/posts/manifest.json registers each post:

    [
      { "slug": "hello-world", "entry": "hello-world/index.md" }
    ]

The slug becomes the URL path: hello-world -> /post/hello-world/. The entry
is relative to content/posts/.

## Adding a post

1. Create content/posts/<slug>/index.md with frontmatter and body.
2. Add an entry to content/posts/manifest.json.
3. Run node scripts/build.js (regenerates homepage log + post page).
4. Run node scripts/generate-rss.js (regenerates feed).
5. Commit.

The pre-commit hook runs steps 3-4 automatically when the commit touches
content/posts/.

## What is not generated

- index.html hand-written sections: brand, bio, metadata grid, works,
  footer. If you add a new project or change the bio, edit index.html
  directly.
- 404.html - static, hand-written.
- css/style.css - one stylesheet, no preprocessing.
- Fonts - IBM Plex Mono, self-hosted as woff2 in assets/fonts/.
- OG image - assets/og/default-og.png is created once by hand and
  referenced by every page's og:image meta tag. No automatic per-post
  generation.

## Directory layout

    index.html                      hand-written + generated log section
    404.html                        hand-written
    rss.xml                         generated
    watse.pdf                       served directly
    post/<slug>/index.html          generated, one per post
    content/posts/<slug>/index.md   authored markdown
    content/posts/manifest.json     list of posts
    css/style.css                   all styling
    assets/fonts/                   IBM Plex Mono woff2 files
    assets/og/default-og.png        single social card image
    scripts/build.js                generates homepage + post pages
    scripts/generate-rss.js         generates rss.xml
    docs/adding-posts.md            workflow guide
    docs/architecture.md            this file
