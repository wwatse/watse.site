# watse.site
my personal website

## Project structure

```
/
├── index.html          # Home page (presentation)
├── writing.html        # Blog listing
├── projects.html       # Projects listing
├── assets/             # SVGs, images, static media
├── css/                # Stylesheets
├── js/                 # Client-side scripts
│   ├── main.js         # Site behavior (entry point)
│   └── content/        # Content loading (prepared, not wired yet)
│       ├── loader.js   # Fetch JSON from /content/
│       └── render.js   # DOM render stubs
└── content/            # Content data (separate from presentation)
    ├── data/           # Site-wide data (site.json, updates.json, posts.json)
    ├── posts/          # Future individual post bodies (markdown, etc.)
    └── projects/       # Project manifests
```

Pages still render hardcoded HTML. JSON in `content/` mirrors the current content and will be loaded by `js/content/` in a later step.

## Build & Maintenance

Install the generator dependencies and the Chromium browser used by Playwright:

```bash
# Install dependencies (Playwright for OG images)
npm install
npx playwright install chromium

# Generate dynamic social cards (Run after adding new markdown posts)
npm run generate-og
```

The generator creates the default social card and one PNG for each Markdown
post in `assets/og/`. See [`docs/og-image-generator.md`](docs/og-image-generator.md)
for the implementation details and maintenance notes.

## Website Purpose

This website doubles as both a personal website and a career portfolio.

- **Personal website:** Blog posts, personal projects, experiments, and links to hobbies and side projects.
- **Career portfolio:** Curated professional projects, case studies, achievements, resume/CV, and contact information.

Content is organized so visitors can explore personal work and professional accomplishments separately.

