# How to Publish a Blog Post

This guide explains how to draft, format, register, and publish a post for the site's Markdown-based content engine.

## Step 1: Create the File

Posts live in `content/posts/`. Each post has its own directory containing an `index.md` file:

```text
content/posts/my-new-post/index.md
```

Use a lowercase, kebab-case slug for the directory and Markdown file name, for example:

```text
my-new-post.md
```

The slug becomes the post URL identifier. Use the same slug in the post directory, the manifest entry, and any generated URL. For example, a post with the slug `my-new-post` is opened at:

```text
post.html?slug=my-new-post
```

Existing posts use the directory form because the content engine expects each manifest entry to point to `<slug>/index.md`.

## Step 2: Add the Front Matter

Every post must begin with YAML-style front matter. The opening `---` must be the first line, and a second `---` must close the metadata block.

Use this required schema:

```yaml
---
title: "Your Post Title Here"
date: YYYY-MM-DD
---
```

The `title` is shown in the archive and on the post page. The `date` controls the archive order and year grouping. Use an ISO date such as `2026-09-14` rather than a display-formatted date.

Posts normally also include a description for the homepage update card and RSS feed:

```yaml
---
title: "Your Post Title Here"
date: 2026-09-14
description: A short summary of the post.
---
```

The content engine treats front matter values as strings. Keep each metadata field on one line and use `key: value` format.

## Step 3: Write the Markdown Body

Add one blank line after the closing front matter delimiter, then write the post in Markdown. Use a level-one heading for the main title only when it improves the post's structure; the post template already displays the front matter title.

Common Markdown patterns include:

```markdown
Write an opening paragraph that introduces the idea.

## A Section Heading

Explain the section in a few clear paragraphs.

- Use lists for grouped points.
- Keep paragraphs readable.

[Link text](https://example.com)

![Alt text](assets/example.png)
```

The content engine renders headings, paragraphs, lists, links, blockquotes, code, and other supported Markdown through the site's Markdown renderer. Keep image paths relative to the page or use a stable site URL, and provide meaningful alt text for accessible images.

## Step 4: Register the Post

Add the new post to `content/posts/manifest.json`. The manifest tells the browser which Markdown files belong to the posts collection.

Add an object with the same slug and an entry path relative to `content/posts/`:

```json
{
  "slug": "my-new-post",
  "entry": "my-new-post/index.md"
}
```

For example, a complete new entry appended to the existing array looks like this:

```json
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
```

Keep slugs unique. A post that is present on disk but missing from the manifest will not appear in the blog archive, homepage updates, or RSS feed.

## Step 5: Generate Supporting Files

When a post is ready to publish, regenerate the site's static social images and RSS feed if those outputs are part of the release:

```bash
npm run generate-og
node scripts/generate-rss.js
```

`npm run generate-og` creates the post's Open Graph image in `assets/og/`. The RSS command reads the posts manifest and writes the updated feed to `rss.xml`.

## Step 6: Test the Post Locally

Open the site through a local web server so the browser can use `fetch()` to load the manifest and Markdown files. For example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/blog.html` and check the following:

1. The new post appears in the correct year group and date order.
2. The post title and description are correct.
3. Opening the post loads `post.html?slug=my-new-post`.
4. Headings, links, lists, code, and images render correctly.
5. The `back to blog` link returns to `blog.html`.
6. The post does not produce console errors or failed network requests.

Also check the homepage. The newest posts can appear in the Updates section when the homepage data is loaded.

## Quick Checklist

- [ ] The file is at `content/posts/<slug>/index.md`.
- [ ] The slug is lowercase and kebab-case.
- [ ] Front matter begins on line 1 and has `title` and `date`.
- [ ] A useful `description` is included.
- [ ] The slug and entry path are in `content/posts/manifest.json`.
- [ ] The post loads from `post.html?slug=<slug>`.
- [ ] Supporting OG images and `rss.xml` are regenerated when needed.
- [ ] The archive and post page were checked in a local browser.
