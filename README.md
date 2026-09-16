# watse.site
my personal website

## Project structure

Top-level pages:

    index.html       home page
    blog.html        blog listing
    projects.html    projects listing
    post.html        single post renderer
    about.html
    now.html
    uses.html
    contact.html
    colophon.html
    404.html

Supporting directories:

    assets/             SVGs, images, generated Open Graph cards
    assets/og/          social share cards (default-og.png + per-post PNGs)
    content/            markdown source and manifests
    content/data/       legacy JSON fallback (projects.json only)
    content/posts/      post markdown + manifest.json
    content/projects/   project markdown + manifest.json + hello-project/
    css/style.css       global stylesheet
    docs/               architecture and workflow docs
    js/content-engine/  loader, parser, transform, templates, router
    js/main.js          site-wide chrome (clock, easter eggs, mobile nav)
    js/updates.js       homepage controller
    js/writing.js       blog archive controller (page is blog.html)
    js/post.js          single post controller
    js/projects.js      projects grid controller
    lib/                standalone markdown renderer
    scripts/            Node generators (rss, og)
    tests/              smoke-test HTML files

The site renders blog content from Markdown through the content engine.
Project data is migrating from content/data/projects.json to
content/projects/<slug>/index.md; until that completes, the projects
page falls back to the legacy JSON file.

## Build and Maintenance

Install the generator dependencies and the Chromium browser used by
Playwright:

    npm install
    npx playwright install chromium

Regenerate content-derived assets after editing markdown:

    npm run generate-og            # writes assets/og/*.png
    node scripts/generate-rss.js   # writes rss.xml

The OG generator writes the default social card plus one PNG per
Markdown post into assets/og/. See docs/og-image-generator.md for
details. The RSS generator writes rss.xml at the project root.

## Website Purpose

This website doubles as both a personal website and a career portfolio.

- Personal website: blog posts, personal projects, experiments, and
  links to hobbies and side projects.
- Career portfolio: curated professional projects, case studies,
  achievements, resume/CV, and contact information.

Content is organized so visitors can explore personal work and
professional accomplishments separately.
