# Content Engine

A small, dependency-free pipeline that turns Markdown files in `content/` into
DOM nodes, so pages render from data instead of hardcoded markup.

This document describes the engine as it exists through Milestone 19: the
original five pipeline stages, the Router facade, the page controllers that
consume it, and the static RSS generator.

## Why a content engine at all?

The site is deliberately static, build-less HTML/CSS/JS. There is no bundler,
no server-side rendering, no framework. Adding a traditional static-site
generator would introduce a toolchain the project does not need.

The engine is the compromise: authoring stays in plain Markdown files
(portable, diff-friendly, editable anywhere) while the browser assembles the
final DOM at runtime. The trade-off is a runtime cost and a `fetch` dependency,
which is fine for a personal site.

A second goal is separation of concerns. Each pipeline stage does exactly one
thing and knows nothing about the others:

    Stage       File                             Responsibility
    ---------   ------------------------------   ----------------------------
    Load        js/content-engine/loader.js      Get raw text from disk
    Parse       js/content-engine/parser.js      Split frontmatter from body
    Render      lib/markdown-renderer.js         Markdown -> HTML string
    Transform   js/content-engine/transform.js   Sort / filter / group
    Template    js/content-engine/templates.js   Data -> DOM nodes
    Router      js/content-engine/router.js      Public API facade
    Control     js/{updates,writing,post,        Page-specific mounting
                  projects}.js

The first five are pure library code. The Router composes them. The page
controllers are the only place that touches the live document.

## Directory structure

    content/
      data/
        projects.json       (legacy - still read by the projects A2 fallback)
      posts/
        manifest.json
        <slug>/
          index.md
      projects/
        manifest.json
        hello-project/
          index.md
    js/
      content-engine/
        loader.js
        parser.js
        transform.js
        templates.js
        router.js
      updates.js            (homepage "thoughts" controller)
      post.js               (single-post controller)
      projects.js           (homepage projects grid controller)
      main.js               (site chrome - companion, transitions, easter eggs)
    lib/
      markdown-renderer.js
    scripts/
      generate-rss.js
      generate-og.js
      og-template.html
    docs/
      content-engine.md
      adding-posts.md
      og-image-generator.md
    assets/
      companion.svg
      og/
        default-og.png
        <slug>.png

### Manifest strategy

Browsers cannot list a directory, so the engine reads an explicit
`manifest.json` per collection. It is a JSON array of entries:

    [
      { "slug": "hello-world", "entry": "hello-world/index.md" }
    ]

Each `entry` is resolved relative to the manifest's own URL, so collections
can live at any depth and be moved without editing path strings inside files.

The manifest is deliberately minimal: only `slug` and `entry`. Everything else
(title, date, tags, description) lives in the file's frontmatter, so there is a
single source of truth per item.

Both collections have manifests. `content/posts/` holds the live posts
(a small set today, but the format scales). `content/projects/` holds one
sample project used to validate the pipeline.

## Stage 1 - Raw Loader (js/content-engine/loader.js)

    ContentEngineLoader.loadCollection(name) -> Promise<LoadedItem[]>
    ContentEngineLoader.runLoaderSmokeTest()

The loader is the only stage that touches the network. It:

1. Computes the site root, then fetches `content/<collection>/manifest.json`.
2. Fetches each entry's raw Markdown text.
3. Returns an array of `{ slug, rawMarkdown, entryPath }`.

### How the site root is resolved

The loader script lives at `js/content-engine/loader.js`, two directories
below the site root. From that script's own URL, `new URL("../../", scriptUrl)`
yields the site root.

The subtlety: `document.currentScript` is only populated during *synchronous*
script execution. Once control returns to the event loop, it becomes null.
Any async caller that asked for the site root at that point used to fall
through to `window.location.href`, which resolves relative to the *current
page's* directory. On a page under `/tests/`, that sent manifest requests to
`/tests/content/...` and 404'd.

The fix (Milestone 9): capture `document.currentScript.src` into a
module-scoped constant `SCRIPT_ORIGIN_SRC` at file-evaluation time, and prefer
it in `getSiteRoot()`. Now the loader resolves correctly no matter when it is
called, from any page, at any depth.

### Why it never throws

If a manifest is missing, malformed, or an entry fails to download, the loader
logs a warning and returns `[]` or an item with an `error` field instead of
rejecting. A personal site should degrade gracefully.

## Stage 2 - Frontmatter & Structure Parser (js/content-engine/parser.js)

    ContentEngineParser.parseMarkdown(rawMarkdown, slug) -> ParsedDocument
    // ParsedDocument = { slug, metadata, body, raw }

The parser recognizes a frontmatter block delimited by a `---` line at the very
top of the file and the next `---` line.

Why hand-rolled instead of YAML: the frontmatter used here is flat `key: value`
pairs. Every value is stored as a string -- `date` stays `"2026-07-12"`,
`featured` stays `"true"` -- and consumers decide how to interpret them.

If no frontmatter block is present, the entire file is treated as the body and
`metadata` is `{}`.

## Stage 3 - Markdown Renderer (lib/markdown-renderer.js)

    MarkdownRenderer.render(markdown)                -> HTML string
    MarkdownRenderer.renderMarkdownToHtml(markdown)  // alias

Deliberately lives in `lib/`, not `js/content-engine/`, because it has no
knowledge of the content engine. It is a pure `string -> string` function.

Supported syntax (intentionally small):

- ATX headings (`#` through `######`) -- emit `id="<slug>"` attributes so
  Table of Contents anchors resolve (Milestone 17)
- Fenced code blocks
- Unordered lists (`-`, `*`, `+`)
- Bold `**...**` and italic `*...*`
- Links `[text](url)`
- Paragraphs (blank-line separated)

### Heading IDs

The heading branch slugifies the heading text (lowercase, spaces to hyphens,
strip punctuation) and emits it as an `id`. This slug function is
byte-identical to the one in `js/post.js`, which builds TOC anchors -- if they
ever diverge, TOC links point to non-existent IDs.

## Stage 4 - Data Transformation Layer (js/content-engine/transform.js)

    ContentEngineTransform.sortByDate(items, order) -> ParsedDocument[]
    ContentEngineTransform.filterFeatured(items)
    ContentEngineTransform.getLatest(items, count)
    ContentEngineTransform.findBySlug(items, slug)
    ContentEngineTransform.groupByYear(items)
    ContentEngineTransform.runTransformSmokeTest()

Pure array functions over `ParsedDocument[]`. They never mutate their input --
`sortByDate` copies before sorting -- so callers can reuse the same collection
in several views without aliasing bugs.

Why `filterFeatured` accepts both `"true"` and `true`: the parser returns every
frontmatter value as a string, so `featured: true` in a file arrives as
`"true"`. The filter tolerates both.

## Stage 5 - DOM Templates Layer (js/content-engine/templates.js)

    ContentEngineTemplates.createPostItem(post)         -> <a>
    ContentEngineTemplates.createProjectCard(project)   -> <article>
    ContentEngineTemplates.createPostPage(post)         -> DocumentFragment
    ContentEngineTemplates.createSectionHeading(title)  -> <h2>
    ContentEngineTemplates.createEmptyState(message)    -> <div>
    ContentEngineTemplates.runTemplatesSmokeTest()

The templates layer is where data becomes DOM. Every template function:

- receives a plain data object,
- returns a new, detached DOM node (or fragment),
- never calls `document.querySelector`,
- never attaches page-specific event listeners.

### Why no `innerHTML +=`

Appending to `innerHTML` re-parses the element's entire markup and destroys
any event listeners attached to its existing children. Templates build
structure with `createElement`, `appendChild`, `replaceChildren`, and
`DocumentFragment`.

The one place an HTML string is unavoidable is a post's body, which arrives as
HTML from `MarkdownRenderer`. That string is parsed once into a fresh, detached
wrapper and its children are moved into a `DocumentFragment`. Because the
wrapper was never attached to the document, there are no listeners to destroy.

### Known gap: BEM class mismatch

`createPostPage` emits `.post__title` / `.post__body` (BEM double-underscore)
and `createProjectCard` emits `.project-card__title` / `.project-card__description`.
Neither set has rules in `css/style.css`. The stylesheet targets the older
single-underscore names: `.post-title`, `.post-body`, `.project-title`,
`.project-description`.

Because of this, the page controllers build DOM manually instead of using
these two templates (see Stage 7). `createEmptyState` and
`createSectionHeading` are used as-is -- their classes do match the stylesheet.
`createPostItem` is the blog-archive row builder, called by `js/writing.js`.

Aligning the BEM classes in `templates.js` with the page CSS would let the
controllers call the templates directly instead of hand-building nodes. That
is a future cleanup (see "Not yet built").

## Stage 6 - Router API Layer (js/content-engine/router.js)

    ContentEngineRouter.getCollection(name)             -> Promise<ParsedDocument[]>
    ContentEngineRouter.getSortedCollection(name, ord)  -> Promise<ParsedDocument[]>
    ContentEngineRouter.getItemBySlug(name, slug)       -> Promise<ParsedDocument | null>
    ContentEngineRouter.getFeaturedItems(name)          -> Promise<ParsedDocument[]>
    ContentEngineRouter.getLatestItems(name, count)     -> Promise<ParsedDocument[]>
    ContentEngineRouter.renderItemPage(name, slug)      -> Promise<DocumentFragment | HTMLElement>
    ContentEngineRouter.runRouterSmokeTest()

The Router is the engine's public API. It is the only stage page controllers
are meant to call directly. Its job is to orchestrate the lower-level modules
so that callers do not have to know the order in which to chain loader ->
parser -> transform -> renderer -> templates.

### Why a facade?

Without a Router, every page that wants "the three most recent posts" would
have to do this:

    const raw = await ContentEngineLoader.loadCollection("posts");
    const parsed = raw.filter(r => r.rawMarkdown).map(r => r.parse(r.rawMarkdown, r.slug));
    const latest = ContentEngineTransform.getLatest(parsed, 3);

That is three modules' worth of coordination that every caller would have to
reproduce. With the Router:

    const latest = await ContentEngineRouter.getLatestItems("posts", 3);

The Router can therefore be changed (caching, a new stage) without touching
any page code.

### What the Router does NOT do

- It does not query the global DOM.
- It does not inject nodes into pages.
- It does not parse `location.pathname` or `?slug=` -- that is URL routing,
  a separate concern.

Every method returns data (arrays, plain documents, DOM nodes, or fragments).
Attachment is the caller's responsibility.

### `renderItemPage` and the BEM problem

`renderItemPage` chains `createPostPage`, which emits BEM classes that no page
styles. As a result, `js/post.js` does not call `renderItemPage` -- it calls
`getSortedCollection`, finds the current post, and builds the post tree by
hand. `renderItemPage` remains available for a future caller whose CSS matches
its output.

## Stage 7 - Page Controllers

Three controllers consume the Router. All three follow the same pattern:
fetch data on `DOMContentLoaded`, build DOM with `createElement` /
`appendChild`, mount with `replaceChildren`. None use `innerHTML` on a
live element.

    Controller         Page                Uses Router for
    ----------------   -----------------   -------------------------------
    js/updates.js      index.html          getLatestItems("posts", 5)
    js/post.js         post/index.html     getSortedCollection("posts","desc")
    js/projects.js     index.html          getSortedCollection("projects","desc")

`js/main.js` is not a controller -- it is site-wide chrome (companion
sprite, page transitions, easter eggs, status rotation) and runs on every
page. It no longer contains navigation code; the site is single-page and
the nav was removed when the architecture collapsed (see Milestone history).

The homepage hosts the projects grid, the "thoughts" list, the inline
experience section, and the contact row. `/post/` renders individual posts.
`/resume/` and `/projects/teach-aid-central.html` are standalone deep links
that don't use the content engine.

### The A2 Parallel-Fetch Fallback Pattern

`updates.js` and `projects.js` were originally written to fetch from two
sources in parallel: the content engine, and a legacy JSON file that
predated it. Whichever returned more items won.

Why it existed: during the migration from legacy JSON to Markdown-in-git,
the engine held fewer items than the legacy file. Rendering the engine's
smaller set would have visibly shrunk the homepage or the archive mid-
migration. A2 kept the page visually identical while migration was
incomplete.

Why "larger" and not "non-zero": an earlier draft said "fall back only if
the engine returns zero items." That was wrong -- with 1 engine item and
30 legacy items, the archive would have shown only 1 post. The "larger
wins" rule made the migration invisible.

Current state:

- Posts: A2 is fully retired. `content/data/posts.json` is gone, and
  `updates.js` no longer attempts a legacy fetch at all. The homepage
  reads from the engine directly.
- Projects: A2 is still active. `content/data/projects.json` holds four
  projects; the engine holds only `hello-project`. Until the projects
  migration completes, the legacy file wins the comparison and the grid
  renders from JSON.

### Why the controllers build DOM by hand

The original integration milestones explicitly allowed (or required)
bypassing `createPostPage` / `createProjectCard` because of the BEM mismatch
described in Stage 5. Building nodes manually in the controller:

- guarantees the exact class names the stylesheet targets,
- preserves the nested `<a>` / thumbnail / info structure on the homepage
  projects grid,
- allows per-page decisions (e.g. date format `DD.MM.YY` in the thoughts
  list) that the generic templates do not know about.

When `templates.js` is aligned with the stylesheet (see "Not yet built"),
each controller can be reduced to a `map` over the collection followed by a
single `replaceChildren`.

### Post page specifics (js/post.js)

Beyond fetching and mounting, `post.js` also:

- **Calculates reading time** from the raw markdown body:
  `Math.max(1, Math.ceil(words / 200))` minutes.
- **Extracts `##` and `###` headings** with a regex, slugifies them, and
  builds a Table of Contents. Anchors match the `id` attributes that
  `MarkdownRenderer` now emits (Milestone 17).
- **Builds prev/next navigation** using the surrounding items in the
  descending-sorted collection: `next` is index - 1 (newer), `prev` is
  index + 1 (older).
- **Intercepts TOC clicks in the capture phase** with `stopPropagation`, so
  the site-wide page-transition handler in `main.js` does not run. Without
  this, `main.js` would fade the body to opacity 0 and navigate to the
  same-document fragment URL, leaving the page blank (the `pageshow` event
  does not fire on same-document navigation, so the fade-in recovery never
  runs).

The `main.js` handler was also fixed in Milestone 18 -- its fragment guard now
checks `link.getAttribute('href')` instead of `link.href`, so fragment-only
links pass through natively. The capture-phase listener in `post.js` remains
as a smooth-scroll enhancement but is no longer strictly required.

## Static RSS Generator (scripts/generate-rss.js)

    node scripts/generate-rss.js

A zero-dependency Node script (only `fs` and `path` from Node's built-ins).
It reads `content/posts/manifest.json`, loads each post's `index.md`,
extracts frontmatter with the same rules as `parser.js`, sorts by date
descending, and writes `rss.xml` to the project root.

### Why a Node script and not browser code

RSS is consumed by feed readers, which fetch a static XML file. The site has no
server, so the XML has to exist as a file on disk. That means generation has to
happen at build/commit time, not at page load. Node is already present on the
developer machine (used by nothing else in this project) so it is the cheapest
tool to reach for -- no `package.json`, no dependencies, no install step.

### Manual build requirement

`rss.xml` is a **build artifact**, not source. It goes stale whenever a post is
added, edited, re-dated, or removed. The generator must be re-run manually
after any content change:

    node scripts/generate-rss.js

A future milestone could wire this into a git hook, a `Makefile` target, or a
small build script, but for now it is a manual step. The `<link
rel="alternate">` tag on every page points at `rss.xml`, which resolves to a
real file (Milestone 14 added the tag; Milestone 19 added the generator).

### Domain constant

The generator hardcodes `SITE_URL = "https://watse.me"` at the top of the
file. This matches the `og:url` meta tag on every page but does **not** match
the developer's shell prompt (`watse.site`). One of the two is wrong; both
should be reconciled to whichever is the real domain before deployment.

## Static OG Image Generator (scripts/generate-og.js)

    npm run generate-og

A Node script that uses Playwright + headless Chromium to render social
share cards from an HTML template (scripts/og-template.html). It writes
assets/og/default-og.png once, plus one <slug>.png for each entry in
content/posts/manifest.json.

### Why Playwright, and why it is the site's only build dependency

The site is otherwise zero-dependency -- no bundler, no framework, no
runtime library. OG cards, however, need PNG rasters: most social crawlers
reject SVG, and text rendering needs a real font stack. Playwright gives
access to a headless browser that can screenshot HTML to PNG.

This is the one place the project accepts an npm dependency. It is a
dev-only dependency: package.json lists it under devDependencies, and
nothing in the browser payload touches it.

### Manual run requirement

Like the RSS generator, generate-og.js is a build-time tool, not a runtime
concern. It must be re-run after adding or editing a post:

    npm run generate-og

The PNGs are committed into assets/og/ so the site remains fully static.
See docs/og-image-generator.md for template details.

### Current limitation

Every page's og:image meta tag currently points at default-og.png,
including post.html. The per-post PNGs are generated but unused. Wiring
them up requires either a build step that rewrites post.html per slug, or
a runtime update via JS (which crawlers won't execute). On the "Not yet
built" list.

## Data flow

    content/<collection>/manifest.json
            |
            v
    loader.js --> [{ slug, rawMarkdown, entryPath }]
            |
            v
    parser.js --> [{ slug, metadata, body, raw }]
            |
            v
    transform.js --> sorted / filtered / grouped ParsedDocument[]
            |
            v
    router.js -- public API facade
            |
            +--> getCollection
            +--> getSortedCollection
            +--> getItemBySlug
            +--> getFeaturedItems
            +--> getLatestItems
            +--> renderItemPage
                     |
                     v
              markdown-renderer.js (body -> HTML string)
                     |
                     v
              templates.js --> detached DOM nodes
                     |
                     v
              page controllers (updates / writing / post / projects)
                     |
                     v
              replaceChildren() into a page container

Parallel to all of the above:

    content/posts/manifest.json + <slug>/index.md
            |
            v
    scripts/generate-rss.js  (Node, local execution)
            |
            v
    rss.xml  (checked into the repo, served as a static file)

## Dead code

The older js/content/ engine attempt has been removed. The legacy
content/data/ JSON files have mostly been purged as well: only
content/data/projects.json remains, because the projects page still
reads it as its A2 fallback until the migration from flat JSON to
per-project index.md files completes. Once content/projects/ holds
as many items as the legacy file, that last fallback can be removed
too.

## Not yet built

- Projects migration. Four projects still live in
  content/data/projects.json. Migrating them to per-project index.md files
  would let js/projects.js drop its A2 fallback and let the last legacy
  JSON file be deleted.
- BEM class alignment in templates.js. createPostPage still emits
  .post__title / .post__body classes that no page styles. The BEM-mismatch
  bypass in the page controllers remains; reconciling the template with
  the stylesheet would let ContentEngineRouter.renderItemPage be used
  directly.
- Manifest-only fetch mode. The homepage loads every post's full Markdown
  body just to render a title and date. A future loader mode could read
  only the frontmatter and defer body fetches until a post is opened.
- Domain reconciliation. watse.me appears in the RSS generator, OG meta
  tags, and the CNAME; the local environment uses watse.site. One of the
  two needs to be picked as canonical before deployment.
- Dynamic per-post OG cards. scripts/generate-og.js writes one PNG per
  post slug, but every page's og:image meta tag currently points at
  default-og.png. Wiring the per-post image into post/index.html would let
  the generated cards actually be used.

## Milestone history

    M7    templates.js + this document
    M8    router.js + router smoke test
    M9    loader.js site-root fix (SCRIPT_ORIGIN_SRC)
    M10   index.html wired to engine (A2 fallback)
    M11   blog.html wired to engine (A2 fallback)
    M12   post.html wired to engine
    M13   projects collection bootstrapped, projects.html wired (A2 fallback)
    M14   favicon / meta description / OG tags / RSS link on all 10 pages
    M15   31 legacy posts migrated to Markdown
    M16   post page enrichment: TOC, reading time, prev/next
    M17   heading IDs in markdown-renderer.js
    M18   fragment-link guard fix in main.js
    M19   static RSS generator (scripts/generate-rss.js)
    M20   documentation refresh
    M21   template reconciliation (createPostItem, project card classes)
    M22   OG image generator (Playwright) + adding-posts.md
    M23   mobile navigation overlay (SVG burger, .name-row flex)
    M24   cleanup: dead backups, legacy data files, stale README
    M25   typography polish: body size + section spacing
    M26   resume page + PDF download
    M27   post description optional (RSS body-excerpt fallback)
    M28   post-specific pixel accents (.post-*)
    M29   single-page collapse: nav removed, 7 pages deleted, controllers
          reduced, thoughts section flattened
