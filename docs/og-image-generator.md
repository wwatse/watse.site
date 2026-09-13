# Open Graph Image Generator

The OG image generator creates PNG social cards for the site. It uses
Playwright to render the shared HTML template in a headless Chromium browser,
so the output matches the browser-rendered design and can be consumed by
social platforms that do not reliably support SVG images.

## Prerequisites

Install the Node dependencies and the Chromium browser binary required by
Playwright:

```bash
npm install
npx playwright install chromium
```

## Generate images

Run the generator from the repository root:

```bash
npm run generate-og
```

The command is also the `generate-og` script in `package.json` and runs
`scripts/generate-og.js`.

## How it works

1. The script creates `assets/og/` if it does not already exist.
2. It loads `scripts/og-template.html` as the shared card template.
3. It recursively finds every Markdown file under `content/posts/`, within the
	site's `content/` content tree.
4. It reads the `title` field from each file's YAML front matter.
5. It renders the title into the template and asks Playwright to take a
	headless browser screenshot at 1200 x 630 pixels.
6. It saves the generated PNG files to `assets/og/`.

The generator also creates `assets/og/default-og.png` with the title
`kelvin watse`. Static pages use this image as their default `og:image` value.

## Output names

Post titles are normalized into lowercase URL-style slugs. For example, a
post titled `Why I Still Use Pixel Art` produces
`assets/og/why-i-still-use-pixel-art.png`. Accented characters are normalized,
non-alphanumeric runs become hyphens, and duplicate titles receive a numeric
suffix such as `-2`.

## Adding or changing a post

After adding a Markdown post or changing its front-matter title, run:

```bash
npm run generate-og
```

Commit the generated PNG files in `assets/og/` with the corresponding content
change. A post must have a non-empty `title` field in its front matter or the
generator exits with an error before completing.

## The template

Edit `scripts/og-template.html` to change the visual design. The generator
replaces the exact `<!--TITLE-->` placeholder with an HTML-escaped title before
rendering. The template is fixed at 1200 x 630 pixels and uses Inter for
typography. Its high-contrast black-and-white layout is defined directly in
the template's CSS; generated images inherit that design.

The template currently loads Inter from Google Fonts. The generator waits for
`document.fonts.ready` before taking each screenshot, but the font request must
be available when the command runs for the intended typography to render.

## Output

Playwright launches Chromium in headless mode, renders the template once for
the default card and once for each Markdown post, then writes the resulting PNG
files to `assets/og/`. Static pages use `assets/og/default-og.png` as their
default `og:image` value.

## Troubleshooting

- If Playwright reports that Chromium is missing, run `npx playwright install chromium`.
- If generation fails on a post, check that its Markdown file contains a front-matter block with a non-empty `title`.
- If an image is stale after a title or template change, run `npm run generate-og` again and review the updated files in `assets/og/`.
