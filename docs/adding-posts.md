# Publishing a post

How to write, register, and publish a post for the log.

## 1. Create the file

Posts live in `content/posts/`. Each post has its own directory with an
`index.md` file:

    content/posts/my-new-post/index.md

Use a lowercase, kebab-case slug for the directory name. The slug becomes
the URL: `my-new-post` -> `/post/my-new-post/`.

## 2. Write the frontmatter

Every post begins with frontmatter. The opening `---` must be line one, and
a second `---` closes the block. Only two fields are required:

    ---
    title: your post title
    date: 2026-09-14
    ---

- `title` - shown in the homepage log and on the post page
- `date` - ISO format (`YYYY-MM-DD`). Controls sort order and RSS.

### Optional: description

A `description:` field is used by the RSS feed and (if you want) the
homepage log. If omitted, the RSS generator falls back to the first ~200
characters of the post body:

    ---
    title: your post title
    date: 2026-09-14
    description: one-line summary
    ---

Every value is treated as a string. Keep each field on one line.

## 3. Write the body

Add one blank line after the closing `---`, then write in Markdown. The post
page already displays the title, so a top-level heading is usually not
needed.

Supported:

- `##` and `###` headings (get slugged ids for anchor links)
- paragraphs
- unordered lists (`-`, `*`, `+`)
- fenced code blocks
- `**bold**`, `*italic*`
- `[link text](https://example.com)`

## 4. Register it

Add an entry to `content/posts/manifest.json`:

    {
      "slug": "my-new-post",
      "entry": "my-new-post/index.md"
    }

Keep slugs unique. A post that exists on disk but not in the manifest will
not appear on the homepage or in the RSS feed.

## 5. Build

Run the build scripts:

    node scripts/build.js
    node scripts/generate-rss.js

`build.js` regenerates the homepage log section and writes
`post/<slug>/index.html`. `generate-rss.js` refreshes the feed.

If you commit the new post file and manifest entry, the pre-commit hook
runs both scripts automatically.

## 6. Test locally

Serve the site and open the homepage:

    python3 -m http.server 8000

Then check:

1. The new post appears in the homepage log, in date order.
2. Clicking it opens `/post/<slug>/`.
3. Headings, links, lists, and code render correctly.
4. The `back` link returns to the homepage.
5. No console errors.

## Quick checklist

- [ ] File at `content/posts/<slug>/index.md`
- [ ] Slug is lowercase and kebab-case
- [ ] Frontmatter has `title` and `date`
- [ ] (Optional) `description:` set for a nicer RSS summary
- [ ] Manifest entry added
- [ ] `node scripts/build.js` run
- [ ] `node scripts/generate-rss.js` run
- [ ] Homepage and post page verified in a browser
