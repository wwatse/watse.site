# watse.site

my personal website.

## What this is

A single-page personal site plus a small log of longer posts. Static HTML,
one stylesheet, two self-hosted fonts. No JavaScript, no build dependencies,
no npm.

## Structure

    index.html                      homepage: bio, works, log
    404.html                        not-found page
    rss.xml                         generated RSS feed
    watse.pdf                       resume PDF (linked from the cv: entry)
    post/<slug>/index.html          one directory per post, generated
    projects/teach-aid-central.html standalone project showcase
    content/posts/<slug>/index.md   authored post markdown
    content/posts/manifest.json     list of posts
    css/style.css                   all styling
    assets/fonts/                   IBM Plex Mono (woff2)
    assets/og/default-og.png        single social card image
    scripts/build.js                generates homepage log + post pages
    scripts/generate-rss.js         generates rss.xml
    docs/adding-posts.md            how to publish a post
    docs/architecture.md            how the build works

The homepage is hand-written except for the log section, which is generated
from `content/posts/manifest.json` between two marker comments.

Post pages are generated one per post from markdown files. There is no
runtime content engine; everything is plain HTML at request time.

## Adding a post

1. Create `content/posts/<slug>/index.md` with frontmatter and body.
2. Add an entry to `content/posts/manifest.json`.
3. Run `node scripts/build.js`.
4. Run `node scripts/generate-rss.js`.
5. Commit.

The pre-commit hook runs steps 3-4 automatically when the commit touches
`content/posts/`. See `docs/adding-posts.md` for the full workflow.

## Build commands

    node scripts/build.js          # regenerate homepage log + post pages
    node scripts/generate-rss.js   # regenerate rss.xml

Both are idempotent. Both use only Node built-ins.

## Dependencies

None. Node is required to run the build scripts, but the site ships as
plain HTML + CSS + woff2 + PDF and works without any toolchain.

## Website purpose

A personal site and portfolio in one place. Posts and projects live on the
homepage; individual posts and the TeachAid Central case study are reachable
at their own URLs.
