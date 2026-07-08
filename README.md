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

## Website Purpose

This website doubles as both a personal website and a career portfolio.

- **Personal website:** Blog posts, personal projects, experiments, and links to hobbies and side projects.
- **Career portfolio:** Curated professional projects, case studies, achievements, resume/CV, and contact information.

Content is organized so visitors can explore personal work and professional accomplishments separately.

