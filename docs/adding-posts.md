# How to Publish a Blog Post

This guide explains how to draft, format, register, and publish a post for
the site's Markdown-based content engine.

## Step 1: Create the File

Posts live in `content/posts/`. Each post has its own directory containing an
`index.md` file:

    content/posts/my-new-post/index.md

Use a lowercase, kebab-case slug for the directory name. The slug becomes the
post's URL identifier, so a post with the slug `my-new-post` is opened at:

    /post/?slug=my-new-post

## Step 2: Add the Front Matter

Every post must begin with YAML-style front matter. The opening `---` must be
the first line, and a second `---` must close the metadata block. Only two
fields are required:

    ---
    title: Your Post Title Here
    date: 2026-09-14
    ---

- `title` — displayed on the homepage's "thoughts" list and on the post page.
- `date` — ISO format (`YYYY-MM-DD`). Controls sort order.

### Optional: description

A `description:` field is optional. If present, it is used by the RSS feed.
If omitted, the RSS generator falls back to the first ~200 characters of the
post's body text, then to the title. You can leave it out entirely; add it
only when you want tighter control over the RSS summary.

    ---
    title: Your Post Title Here
    date: 2026-09-14
    description: A short summary used in the RSS feed.
    ---

Front matter values are treated as strings. Keep each field on one line and
use `key: value` format.

## Step 3: Write the Markdown Body

Add one blank line after the closing front matter delimiter, then write the
post in Markdown. The post template already displays the front matter title,
so a level-one heading is only needed if it improves the post's structure.

Common Markdown patterns:

    Write an opening paragraph that introduces the idea.

    ## A Section Heading

    Explain the section in a few clear paragraphs.

    - Use lists for grouped points.
    - Keep paragraphs readable.

    [Link text](https://example.com)

The content engine renders headings, paragraphs, lists, links, blockquotes,
and code blocks through the site's Markdown renderer.

## Step 4: Register the Post

Add the new post to `content/posts/manifest.json`. The manifest tells the
browser which Markdown files belong to the posts collection. Add an object
with the same slug and an entry path relative to `content/posts/`:

    {
      "slug": "my-new-post",
      "entry": "my-new-post/index.md"
    }

A complete new entry appended to the existing array looks like this:

    [
      {
        "slug": "hello-world",
        "entry": "hello-world/index.md"
      },
      {
        "slug": "my-new-post",
        "entry": "my-new-post/index.md"
      }
    ]

Keep slugs unique. A post present on disk but missing from the manifest will
not appear on the homepage or in the RSS feed.

## Step 5: Generate Supporting Files

When a post is ready to publish, regenerate the site's static RSS feed and
social card:

    node scripts/generate-rss.js
    npm run generate-og

The RSS command writes `rss.xml` at the project root. The OG command writes
the post's social card into `assets/og/`.

Both outputs are committed to git, so they ship as static files with the
site.

## Step 6: Test the Post Locally

Open the site through a local web server so the browser can `fetch()` the
manifest and Markdown files:

    python3 -m http.server 8000

Then open `http://localhost:8000/` and check:

1. The new post appears in the "thoughts" list on the homepage, in date order.
2. Clicking the post opens `/post/?slug=my-new-post`.
3. Headings, links, lists, and code render correctly.
4. The `← back` link returns to the homepage.
5. The post does not produce console errors or failed network requests.

## Quick Checklist

- [ ] The file is at `content/posts/<slug>/index.md`.
- [ ] The slug is lowercase and kebab-case.
- [ ] Front matter begins on line 1 and has `title` and `date`.
- [ ] (Optional) A `description:` is included for the RSS feed. If omitted,
      the feed uses the first ~200 chars of the body.
- [ ] The slug and entry path are in `content/posts/manifest.json`.
- [ ] The post loads from `/post/?slug=<slug>`.
- [ ] `rss.xml` and the OG card are regenerated before committing.
