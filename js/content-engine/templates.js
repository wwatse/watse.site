(function (globalScope) {
  "use strict";

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  function isNonEmptyString(value) {
    return typeof value === "string" && value.trim() !== "";
  }

  function getMetadata(source) {
    if (source && typeof source === "object" && source.metadata && typeof source.metadata === "object") {
      return source.metadata;
    }
    return {};
  }

  // Accepts either a parser-shaped object ({ metadata: { ... } }) or a flat
  // object ({ title, date, ... }). Metadata wins when both are present.
  function getField(source, keys) {
    if (!source || typeof source !== "object") return "";
    const metadata = getMetadata(source);

    for (let i = 0; i < keys.length; i += 1) {
      const v = metadata[keys[i]];
      if (v !== undefined && v !== null && v !== "") return String(v);
    }
    for (let i = 0; i < keys.length; i += 1) {
      const v = source[keys[i]];
      if (v !== undefined && v !== null && v !== "") return String(v);
    }
    return "";
  }

  function parseTags(value) {
    if (Array.isArray(value)) {
      return value.map((t) => String(t).trim()).filter(Boolean);
    }
    if (isNonEmptyString(value)) {
      return value.split(",").map((t) => t.trim()).filter(Boolean);
    }
    return [];
  }

  // Turn an HTML string into a DocumentFragment using a fresh, detached
  // wrapper. The wrapper is never attached to the document, so no live-DOM
  // reparse or listener destruction occurs.
  function htmlStringToFragment(htmlString) {
    const fragment = document.createDocumentFragment();
    if (!isNonEmptyString(htmlString)) return fragment;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = htmlString;
    while (wrapper.firstChild) fragment.appendChild(wrapper.firstChild);
    return fragment;
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function resolvePostHtml(post) {
    if (!post || typeof post !== "object") return "";
    if (isNonEmptyString(post.renderedHtml)) return post.renderedHtml;
    if (isNonEmptyString(post.body)) {
      const renderer = globalScope.MarkdownRenderer;
      if (renderer && typeof renderer.render === "function") {
        try {
          return renderer.render(post.body);
        } catch (error) {
          console.warn("[content-engine/templates] MarkdownRenderer failed; falling back to plain text.", error);
        }
      }
      return "<p>" + escapeHtml(post.body) + "</p>";
    }
    return "";
  }

  // Archive rows use the site-wide DD.MM.YYYY format.
  function formatDateDDMMYYYY(isoDate) {
    const parsed = new Date(isoDate);
    if (isNaN(parsed.getTime())) return isoDate || "";
    const day = String(parsed.getDate()).padStart(2, "0");
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const year = String(parsed.getFullYear());
    return day + "." + month + "." + year;
  }

  // ---------------------------------------------------------------------------
  // Templates
  // ---------------------------------------------------------------------------

  // Archive row on blog.html. Matches .post-link-archive / .post-title-archive
  // / .post-date-archive from css/style.css. Emits an <a>, not an <li>, because
  // the archive container is a flat flex column of anchors (year grouping is
  // the controller's responsibility).
  function createPostItem(post) {
    const link = document.createElement("a");
    link.className = "post-link-archive";

    const slug = getField(post, ["slug"]);
    link.href = slug ? "/post?slug=" + encodeURIComponent(slug) : "/post";

    const title = document.createElement("span");
    title.className = "post-title-archive";
    title.textContent = "# " + (getField(post, ["title"]) || "(untitled)");
    link.appendChild(title);

    const dateIso = getField(post, ["date"]);
    if (dateIso) {
      const date = document.createElement("span");
      date.className = "post-date-archive";
      date.textContent = formatDateDDMMYYYY(dateIso);
      link.appendChild(date);
    }

    return link;
  }

  // Project card on projects.html and the homepage. Matches the exact class
  // structure css/style.css targets: .project-card -> .project-link ->
  // .project-thumbnail.tag-{tag} > .project-thumbnail-icon, and
  // .project-info > .project-title / .project-description / .project-tag.
  function createProjectCard(project) {
    const EMOJI_MAP = { web: "\uD83C\uDF10", experiment: "\uD83E\uDDEA", tool: "\uD83D\uDEE0\uFE0F" };
    const DEFAULT_EMOJI = "\uD83D\uDCBB";
    const DEFAULT_TAG = "tool";

    const rawTag = getField(project, ["tag"]) || DEFAULT_TAG;
    const tagLower = rawTag.toLowerCase();
    const emoji = EMOJI_MAP[tagLower] || DEFAULT_EMOJI;

    const card = document.createElement("div");
    card.className = "project-card";
    // Legacy flag: the first project gets a stable id for CSS or scripts that
    // look it up by #latest-project.
    const slug = getField(project, ["slug"]);
    const id = project && (project.id === 1 || project.id === "latest-project");
    if (id || slug === "project-one") {
      card.id = "latest-project";
    }

    const link = document.createElement("a");
    link.href = "/projects";
    link.className = "project-link";
    link.style.textDecoration = "none";
    link.style.color = "inherit";
    link.style.display = "flex";
    link.style.flexDirection = "column";
    link.style.height = "100%";

    const thumb = document.createElement("div");
    thumb.className = "project-thumbnail tag-" + tagLower;
    const icon = document.createElement("span");
    icon.className = "project-thumbnail-icon";
    icon.textContent = emoji;
    thumb.appendChild(icon);
    link.appendChild(thumb);

    const info = document.createElement("div");
    info.className = "project-info";

    const titleEl = document.createElement("p");
    titleEl.className = "project-title";
    titleEl.textContent = getField(project, ["title", "name"]) || "Untitled Project";
    info.appendChild(titleEl);

    const descEl = document.createElement("p");
    descEl.className = "project-description";
    descEl.textContent = getField(project, ["description", "summary"]);
    info.appendChild(descEl);

    const tagEl = document.createElement("span");
    tagEl.className = "project-tag";
    tagEl.textContent = rawTag;
    info.appendChild(tagEl);

    link.appendChild(info);
    card.appendChild(link);
    return card;
  }

  // Full post page. Currently unused by js/post.js (which builds its own tree
  // to match .post-title / .post-body / .post-meta). Kept for callers whose
  // CSS matches the BEM-style .post__* classes emitted here.
  function createPostPage(post) {
    const fragment = document.createDocumentFragment();
    const article = document.createElement("article");
    article.className = "post";

    const title = getField(post, ["title"]) || "(untitled)";
    const date = getField(post, ["date"]);
    const tags = parseTags(getField(post, ["tags"]));

    const header = document.createElement("header");
    header.className = "post__header";

    const heading = document.createElement("h1");
    heading.className = "post__title";
    heading.textContent = title;
    header.appendChild(heading);

    if (date) {
      const time = document.createElement("time");
      time.className = "post__date";
      time.setAttribute("datetime", date);
      time.textContent = date;
      header.appendChild(time);
    }

    if (tags.length > 0) {
      const tagList = document.createElement("ul");
      tagList.className = "post__tags";
      tags.forEach((tag) => {
        const tagItem = document.createElement("li");
        tagItem.textContent = tag;
        tagList.appendChild(tagItem);
      });
      header.appendChild(tagList);
    }

    article.appendChild(header);

    const body = document.createElement("div");
    body.className = "post__body";
    body.appendChild(htmlStringToFragment(resolvePostHtml(post)));
    article.appendChild(body);

    fragment.appendChild(article);
    return fragment;
  }

  function createSectionHeading(title) {
    const heading = document.createElement("h2");
    heading.className = "section-heading";
    heading.textContent = isNonEmptyString(title) ? title : "";
    return heading;
  }

  function createEmptyState(message) {
    const container = document.createElement("div");
    container.className = "empty-state";
    const text = document.createElement("p");
    text.className = "empty-state__message";
    text.textContent = isNonEmptyString(message) ? message : "Nothing here yet.";
    container.appendChild(text);
    return container;
  }

  // ---------------------------------------------------------------------------
  // Smoke test
  // ---------------------------------------------------------------------------

  function runTemplatesSmokeTest() {
    const results = [];
    function assert(name, condition) {
      results.push({ name: name, passed: Boolean(condition) });
    }

    const samplePost = {
      slug: "hello-world",
      metadata: {
        title: "Hello World",
        date: "2026-07-12",
        description: "A first post.",
        tags: "intro, meta"
      },
      body: "Hello world.\n\nThis is my first Markdown post."
    };

    const item = createPostItem(samplePost);
    assert("createPostItem returns an <a>", item instanceof HTMLElement && item.tagName === "A");
    assert("post item has .post-link-archive class", item.className === "post-link-archive");
    assert("post item contains title", item.textContent.indexOf("Hello World") !== -1);
    assert("post item contains DD.MM.YYYY date", item.textContent.indexOf("12.07.2026") !== -1);
    assert("post item href points at post.html?slug=", item.getAttribute("href").indexOf("/post?slug=hello-world") !== -1);

    const itemNoData = createPostItem({});
    assert("createPostItem tolerates missing data", itemNoData instanceof HTMLElement && itemNoData.tagName === "A");

    const card = createProjectCard({ title: "Demo", description: "A demo project.", tag: "web" });
    assert("createProjectCard returns an element", card instanceof HTMLElement);
    assert("project card has .project-card class", card.className === "project-card");
    assert("project card contains title", card.textContent.indexOf("Demo") !== -1);
    assert("project card thumbnail has tag class", card.querySelector(".project-thumbnail.tag-web") !== null);
    assert("project card has .project-title", card.querySelector(".project-title") !== null);
    assert("project card has .project-description", card.querySelector(".project-description") !== null);
    assert("project card has .project-tag", card.querySelector(".project-tag") !== null);

    const cardNoData = createProjectCard({});
    assert("createProjectCard tolerates missing data", cardNoData instanceof HTMLElement);

    const page = createPostPage(samplePost);
    assert("createPostPage returns a DocumentFragment", page instanceof DocumentFragment);
    const probe = document.createElement("div");
    probe.appendChild(page.cloneNode(true));
    assert("post page contains title", probe.textContent.indexOf("Hello World") !== -1);

    const heading = createSectionHeading("Recent Posts");
    assert("createSectionHeading returns an <h2>", heading instanceof HTMLElement && heading.tagName === "H2");
    assert("section heading text is set", heading.textContent === "Recent Posts");

    const emptyState = createEmptyState("No posts yet.");
    assert("createEmptyState returns an element", emptyState instanceof HTMLElement);
    assert("empty state message is set", emptyState.textContent.indexOf("No posts yet.") !== -1);

    const failures = results.filter((r) => !r.passed);
    const passedCount = results.length - failures.length;
    console.log("[content-engine/templates] smoke test: " + passedCount + "/" + results.length + " passed");
    if (failures.length > 0) console.warn("[content-engine/templates] failed assertions:", failures);
    return { results: results, passed: failures.length === 0 };
  }

  globalScope.ContentEngineTemplates = {
    createPostItem: createPostItem,
    createProjectCard: createProjectCard,
    createPostPage: createPostPage,
    createSectionHeading: createSectionHeading,
    createEmptyState: createEmptyState,
    runTemplatesSmokeTest: runTemplatesSmokeTest
  };

  if (typeof window !== "undefined" && typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", runTemplatesSmokeTest);
    } else {
      runTemplatesSmokeTest();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
