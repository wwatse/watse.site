# watse.site
my personal website

## Project structure

Top level:

    index.html                single-page site: name, bio, projects,
                              thoughts, experience, contact
    404.html                  not-found page
    rss.xml                   generated RSS feed (committed)
    watse.pdf                 resume PDF (linked from contact row)

Deep links (not in nav, reachable by direct URL):

    post/index.html           individual post renderer
    resume/index.html         resume document with PDF download
    projects/teach-aid-central.html
                              standalone project showcase

Supporting directories:

    assets/                   SVGs, images, generated OG cards
    assets/og/                social share cards
    assets/images/            project logos
    content/                  markdown source and manifests
    content/data/             legacy JSON (projects.json only)
    content/posts/            post markdown + manifest.json
    content/projects/         project markdown + manifest.json
    css/style.css             global stylesheet
    docs/                     architecture and workflow docs
    js/content-engine/        loader, parser, transform, templates, router
    js/main.js                site chrome
    js/updates.js             homepage thoughts list
    js/post.js                post page controller
    js/projects.js            homepage projects grid
    lib/                      standalone markdown renderer
    scripts/                  Node generators (rss, og)
    tests/                    smoke-test HTML files

The site is deliberately single-page. The homepage is the site. Everything
that doesn't fit inline (individual posts, the resume document, the TeachAid
showcase) lives behind a direct URL rather than competing for attention in
a nav bar. Navigation is done by scrolling and by clicking inline links.

Blog content is authored as Markdown in `content/posts/` and rendered at
runtime by the content engine. See `docs/content-engine.md` for the
architecture and `docs/adding-posts.md` for the publishing workflow.

## Build and Maintenance

Install the generator dependencies and the Chromium browser used by
Playwright:

    npm install
    npx playwright install chromium

Regenerate content-derived assets after editing Markdown:

    node scripts/generate-rss.js   # writes rss.xml at the project root
    npm run generate-og            # writes assets/og/*.png

Both outputs are committed so the site ships as static files. The RSS
generator falls back to the first ~200 characters of a post's body if the
frontmatter omits a `description:`. See `docs/adding-posts.md` for details.

A pre-commit git hook (`.git/hooks/pre-commit`, local only) regenerates
`rss.xml` automatically when a commit touches `content/posts/`.

## Website Purpose

This website doubles as both a personal website and a career portfolio.

- **Personal website:** short-form thoughts, personal projects,
  experiments, and links to hobbies and side projects.
- **Career portfolio:** professional experience, resume PDF, project
  case studies, and contact information.

Content is organized so visitors can explore personal work and
professional accomplishments on the same page.
