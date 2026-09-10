# Content Engine

A small, dependency-free pipeline that turns Markdown files in `content/` into
DOM nodes, so pages can eventually stop hardcoding article and project markup.

This document describes the engine as it exists through Milestone 9. Anything
not listed here (page controllers, wiring the engine into the existing HTML
pages) has not been built yet and is intentionally omitted.

## Why a content engine at all?

The site is deliberately static, build-less HTML/CSS/JS. There is no bundler,
no server-side rendering, no framework. Adding a traditional static-site
generator would introduce a toolchain the project does not need.

The engine is the compromise: authoring stays in plain Markdown files
(portable, diff-friendly, editable anywhere) while the browser assembles the
final DOM at runtime. The trade-off is a runtime cost and a `fetch` dependency,
which is fine for a personal site.

A second goal is separation of concerns. Each stage does exactly one thing:

    Stage       File                             Responsibility
    ---------   ------------------------------   ----------------------------
    Load        js/content-engine/loader.js      Get raw text from disk
    Parse       js/content-engine/parser.js      Split frontmatter from body
    Render      lib/markdown-renderer.js         Markdown -> HTML string
    Transform   js/content-engine/transform.js   Sort / filter / group
    Template    js/content-engine/templates.js   Data -> DOM nodes
    Router      js/content-engine/router.js      Public API facade

Each stage is a plain function (or async function) attached to a global, so
each can be tested in isolation and replaced independently. The Router sits on
top as the only entry point that page code needs to know about.

## Directory structure & manifest strategy

    content/
      data/
        posts.json
        projects.json
        site.json
        updates.json
      posts/
        manifest.json
        hello-world/
          index.md
      projects/
        projects.json

### Why a manifest per collection?

Browsers cannot list a directory, so the engine reads an explicit
`manifest.json` per collection. It is a JSON array of entries:

    [
      { "slug": "hello-world", "entry": "hello-world/index.md" }
    ]

Each `entry` is resolved relative to the manifest's own URL, so collections
can live at any depth and be moved without editing path strings inside files.

The manifest is deliberately minimal: only `slug` and `entry`. Everything else
(title, date, tags, description) lives in the file's frontmatter, so there is a
single source of truth per item and no risk of manifest and document
disagreeing.

### Why `content/data/*.json` still exists

Those files predate the engine. They mirror the hardcoded content currently
baked into the HTML pages and are not consumed by any engine stage yet. They
are kept as reference material during migration and will be retired once the
engine is wired in.

Only `posts` currently ships a real manifest. A `projects` manifest has not
been introduced; `content/projects/projects.json` is still legacy data.

## 1. Raw Loader -- js/content-engine/loader.js

    ContentEngineLoader.loadCollection(name) -> Promise<LoadedItem[]>
    ContentEngineLoader.runLoaderSmokeTest()

The loader is the only stage that touches the network. It:

1. Computes the site root, then fetches `content/<collection>/manifest.json`.
2. Fetches each entry's raw Markdown text.
3. Returns an array of `{ slug, rawMarkdown, entryPath }`.

### How the site root is resolved

This is the trickiest part of the loader, and the one that caused a real bug
in earlier milestones. The loader script lives at
`js/content-engine/loader.js`, i.e. two directories below the site root. From
that script's own URL, `new URL("../../", scriptUrl)` yields the site root.

The subtlety: `document.currentScript` is only populated during *synchronous*
script execution. Once control returns to the event loop (and especially after
`DOMContentLoaded`), it becomes null. Any async caller that asked for the site
root at that point used to fall through to `window.location.href`, which
resolves relative to the *current page's* directory. On a page under
`/tests/`, that sent manifest requests to `/tests/content/...` and 404'd.

The fix (Milestone 9): capture `document.currentScript.src` into a
module-scoped constant `SCRIPT_ORIGIN_SRC` at file-evaluation time, and prefer
it in `getSiteRoot()`. Now the loader resolves correctly no matter when it is
called, from any page, at any depth. The `window.location` fallback remains for
non-browser environments (e.g. Node) where `document` does not exist.

### Why it never throws

If a manifest is missing, malformed, or an entry fails to download, the loader
logs a warning and returns `[]` or an item with an `error` field instead of
rejecting. A personal site should degrade gracefully -- one broken post should
not blank a page.

### Why raw text, not parsed data

Parsing is a separate concern (`parser.js`). Keeping the loader dumb means the
parser can be unit-tested with literal strings and no network.

## 2. Frontmatter & Structure Parser -- js/content-engine/parser.js

    ContentEngineParser.parseMarkdown(rawMarkdown, slug) -> ParsedDocument
    // ParsedDocument = { slug, metadata, body, raw }

The parser recognizes a frontmatter block delimited by a `---` line at the very
top of the file and the next `---` line:

    ---
    title: Hello World
    date: 2026-07-12
    description: A first post for the new content engine.
    ---

    Hello world.

Why hand-rolled instead of YAML: the frontmatter used here is flat `key: value`
pairs. Adding a YAML parser would be disproportionate. Every value is stored as
a string -- `date` stays `"2026-07-12"`, `featured` stays `"true"` -- and
consumers decide how to interpret them. This keeps the parser predictable and
free of format-specific opinions.

If no frontmatter block is present, the entire file is treated as the body and
`metadata` is `{}` -- a plain `.md` file is still valid input.

## 3. Standalone Markdown Renderer -- lib/markdown-renderer.js

    MarkdownRenderer.render(markdown)                -> HTML string
    MarkdownRenderer.renderMarkdownToHtml(markdown)  // alias

Deliberately lives in `lib/`, not `js/content-engine/`, because it has no
knowledge of the content engine. It is a pure `string -> string` function that
could be used anywhere.

Supported syntax (intentionally small):

- ATX headings (`#` through `######`)
- Fenced code blocks
- Unordered lists (`-`, `*`, `+`)
- Bold `**...**` and italic `*...*`
- Links `[text](url)`
- Paragraphs (blank-line separated)

Why so limited: the goal is a personal blog, not a CommonMark processor. Each
construct is a few lines and easy to reason about.

## 4. Data Transformation Layer -- js/content-engine/transform.js

    ContentEngineTransform.sortByDate(items, order) -> ParsedDocument[]
    ContentEngineTransform.filterFeatured(items)
    ContentEngineTransform.getLatest(items, count)
    ContentEngineTransform.findBySlug(items, slug)
    ContentEngineTransform.groupByYear(items)
    ContentEngineTransform.runTransformSmokeTest()

Pure array functions over `ParsedDocument[]`. They never mutate their input --
`sortByDate` copies before sorting -- so callers can reuse the same collection
in several views without aliasing bugs.

Why dates come from `metadata.date`: the transform layer only needs one
convention. Missing dates fall back to `new Date(0)`, so un-dated items sink to
the bottom instead of throwing.

Why `filterFeatured` accepts both `"true"` and `true`: the parser returns every
frontmatter value as a string, so `featured: true` in a file arrives as
`"true"`. The filter tolerates both.

## 5. DOM Templates Layer -- js/content-engine/templates.js

    ContentEngineTemplates.createPostListItem(post)     -> <li>
    ContentEngineTemplates.createProjectCard(project)   -> <article>
    ContentEngineTemplates.createPostPage(post)         -> DocumentFragment
    ContentEngineTemplates.createSectionHeading(title)  -> <h2>
    ContentEngineTemplates.createEmptyState(message)    -> <div>
    ContentEngineTemplates.runTemplatesSmokeTest()

The templates layer is where data becomes DOM. It mirrors the markdown
renderer: the renderer goes `string -> string`; templates go `object -> Node`.

Why pure functions with no side effects: every template function

- receives a plain data object,
- returns a new, detached DOM node (or fragment),
- never calls `document.querySelector`,
- never attaches page-specific event listeners,
- never mutates global state.

A caller can therefore build a whole subtree off-screen and attach it once,
avoiding layout thrash -- and templates can be tested by inspecting the
returned node's `textContent` / `childNodes` without a live page.

Why no `innerHTML +=`: appending to `innerHTML` re-parses the element's entire
markup and destroys any event listeners or state attached to its existing
children. Templates build structure with `createElement`, `appendChild`,
`replaceChildren`, and `DocumentFragment`.

The one place an HTML string is unavoidable is a post's body, which arrives as
HTML from `MarkdownRenderer`. That string is parsed once into a fresh, detached
wrapper and its children are moved into a `DocumentFragment` (see
`htmlStringToFragment`). Because the wrapper was never attached to the
document, there are no listeners to destroy -- this is the safe, single-use
form of `innerHTML`, not the forbidden `+=` form.

Resilient fallbacks: missing `title`, `date`, `tags`, `slug`, `description`, or
body are all tolerated.

    Function               Returns            Purpose
    --------------------   ----------------   ------------------------------
    createPostListItem     <li>               One row in a writing index
    createProjectCard      <article>          Project title/description/tags
    createPostPage         DocumentFragment   Full post: header + body
    createSectionHeading   <h2>               Section label for lists
    createEmptyState       <div>              Fallback for empty collections

## 6. Router API Layer -- js/content-engine/router.js

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
parser -> transform -> renderer -> templates, or which module owns which
operation.

### Why a facade?

Without a Router, every page that wants "the three most recent posts" would
have to do this:

    const raw = await ContentEngineLoader.loadCollection("posts");
    const parsed = raw.filter(r => r.rawMarkdown).map(r => ContentEngineParser.parseMarkdown(r.rawMarkdown, r.slug));
    const latest = ContentEngineTransform.getLatest(parsed, 3);

That is three modules' worth of coordination that every caller would have to
reproduce. With the Router, the same operation is:

    const latest = await ContentEngineRouter.getLatestItems("posts", 3);

The Router can therefore be changed (e.g. to add caching, or a new stage)
without touching any page code. It also gives the page controllers a single
import surface, so refactors do not ripple through the site.

### What the Router does NOT do

- It does not query the global DOM.
- It does not inject nodes into pages.
- It does not parse `location.pathname` or `?slug=` -- that would be a *URL*
  router, which is a separate, later concern. `ContentEngineRouter` is an API
  router: it dispatches calls to the right engine stages.

Every method returns data (arrays, plain documents, DOM nodes, or fragments).
Attachment is the caller's responsibility.

### The methods

`getCollection(name)`
Loads and parses the collection. Returns parsed documents in manifest order.
Failed entries (missing raw markdown) are dropped before this returns, so
callers never see half-objects.

`getSortedCollection(name, order)`
Same as `getCollection`, then sorted by `metadata.date` via
`ContentEngineTransform.sortByDate`. `order` defaults to `"desc"`.

`getItemBySlug(name, slug)`
Returns a single parsed document, or `null` if the slug is not in the
collection. Uses `ContentEngineTransform.findBySlug`.

`getFeaturedItems(name)`
Returns only items whose frontmatter marks them as featured, via
`ContentEngineTransform.filterFeatured`.

`getLatestItems(name, count)`
Returns the N most recent items (default 3) via
`ContentEngineTransform.getLatest`.

`renderItemPage(name, slug)`
Fetches the item by slug, renders its body through `MarkdownRenderer`, and
hands the result to `ContentEngineTemplates.createPostPage`. Returns a
`DocumentFragment` ready for attachment. If the slug is not found, returns
`ContentEngineTemplates.createEmptyState("Item not found")` instead of
throwing.

### Dependency resolution

The Router resolves its dependencies lazily, at call time, via a
`getDependencies()` helper. Each missing module produces a clear
`[content-engine/router] Missing dependency: X` error rather than a silent
empty array. This also means script tags can be included in any order relative
to each other.

### Smoke test

`runRouterSmokeTest()` exercises every method against the real `posts`
collection: existence, correct slug, descending sort, `null` for missing
slugs, count limits, DOM-fragment return types, and empty-state for missing
items. It runs automatically on `DOMContentLoaded`, matching the other engine
modules.

A standalone runner lives at `tests/router-smoke.html`.

## Data flow

Callers interact only with the Router. Underneath, the Router coordinates the
four pipeline stages (and the markdown renderer):

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
              (future) page controllers attach them

The lower-level modules are still individually loadable and testable, but page
code should treat `ContentEngineRouter` as the entry point.

## Not yet built

To keep this document honest, the following are NOT part of the engine yet:

- Page controllers. No code wires `ContentEngineRouter` output into
  `writing.html`, `projects.html`, `post.html`, or the homepage. The engine can
  be exercised only via its smoke tests and the test HTML files.
- A URL router. `ContentEngineRouter` is an API facade, not a URL dispatcher.
  Nothing parses `?slug=` or `location.pathname` to pick a post yet.
- A build step. The engine runs entirely in the browser at runtime.
- A migration of `content/data/*.json`. Those files remain unused.
- A `projects` manifest. Only `posts` has a `manifest.json` today.

Each is a later milestone. Until then, the existing pages continue to render
their hardcoded HTML.
