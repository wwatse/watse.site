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
    if (!source || typeof source !== "object") {
      return "";
    }

    const metadata = getMetadata(source);

    for (let i = 0; i < keys.length; i += 1) {
      const fromMetadata = metadata[keys[i]];
      if (fromMetadata !== undefined && fromMetadata !== null && fromMetadata !== "") {
        return String(fromMetadata);
      }
    }

    for (let i = 0; i < keys.length; i += 1) {
      const fromSource = source[keys[i]];
      if (fromSource !== undefined && fromSource !== null && fromSource !== "") {
        return String(fromSource);
      }
    }

    return "";
  }

  function parseTags(value) {
    if (Array.isArray(value)) {
      return value.map((tag) => String(tag).trim()).filter(Boolean);
    }
    if (isNonEmptyString(value)) {
      return value.split(",").map((tag) => tag.trim()).filter(Boolean);
    }
    return [];
  }

  // Turn an HTML string into a DocumentFragment without touching any attached
  // DOM. innerHTML is used ONCE on a fresh, detached wrapper; the forbidden
  // pattern is `element.innerHTML += ...`, which re-parses a live element and
  // destroys listeners on its existing children.
  function htmlStringToFragment(htmlString) {
    const fragment = document.createDocumentFragment();

    if (!isNonEmptyString(htmlString)) {
      return fragment;
    }

    const wrapper = document.createElement("div");
    wrapper.innerHTML = htmlString;

    while (wrapper.firstChild) {
      fragment.appendChild(wrapper.firstChild);
    }

    return fragment;
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function resolvePostHtml(post) {
    if (!post || typeof post !== "object") {
      return "";
    }

    if (isNonEmptyString(post.renderedHtml)) {
      return post.renderedHtml;
    }

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

  // ---------------------------------------------------------------------------
  // Templates
  // ---------------------------------------------------------------------------

  function createPostListItem(post) {
    const item = document.createElement("li");
    item.className = "post-list-item";

    const title = getField(post, ["title"]) || "(untitled)";
    const date = getField(post, ["date"]);
    const slug = getField(post, ["slug"]);
    const href = slug ? "post.html?slug=" + encodeURIComponent(slug) : "";

    let titleNode;

    if (href) {
      titleNode = document.createElement("a");
      titleNode.setAttribute("href", href);
    } else {
      titleNode = document.createElement("span");
    }

    titleNode.className = "post-list-item__title";
    titleNode.textContent = "# " + title;
    item.appendChild(titleNode);

    if (date) {
      const time = document.createElement("time");
      time.className = "post-list-item__date";
      time.setAttribute("datetime", date);
      time.textContent = date;
      item.appendChild(time);
    }

    return item;
  }

  function createProjectCard(project) {
    const card = document.createElement("article");
    card.className = "project-card";

    const title = getField(project, ["title", "name"]) || "(untitled project)";
    const description = getField(project, ["description", "summary"]);
    const url = getField(project, ["url", "link", "href"]);
    const tags = parseTags(getField(project, ["tags", "stack", "tech"]));

    const heading = document.createElement("h3");
    heading.className = "project-card__title";

    if (url) {
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.textContent = title;
      heading.appendChild(link);
    } else {
      heading.textContent = title;
    }
    card.appendChild(heading);

    if (description) {
      const paragraph = document.createElement("p");
      paragraph.className = "project-card__description";
      paragraph.textContent = description;
      card.appendChild(paragraph);
    }

    if (tags.length > 0) {
      const tagList = document.createElement("ul");
      tagList.className = "project-card__tags";
      tags.forEach((tag) => {
        const tagItem = document.createElement("li");
        tagItem.textContent = tag;
        tagList.appendChild(tagItem);
      });
      card.appendChild(tagList);
    }

    return card;
  }

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
        description: "A first post for the new content engine.",
        tags: "intro, meta"
      },
      body: "Hello world.\n\nThis is my first Markdown post."
    };

    const listItem = createPostListItem(samplePost);
    assert("createPostListItem returns an <li>", listItem instanceof HTMLElement && listItem.tagName === "LI");
    assert("post list item contains title", listItem.textContent.indexOf("Hello World") !== -1);
    assert("post list item contains date", listItem.textContent.indexOf("2026-07-12") !== -1);

    const listItemNoData = createPostListItem({});
    assert("createPostListItem tolerates missing data", listItemNoData instanceof HTMLElement);

    const card = createProjectCard({ title: "Demo", description: "A demo project.", tags: "js, dom" });
    assert("createProjectCard returns an element", card instanceof HTMLElement);
    assert("project card contains title", card.textContent.indexOf("Demo") !== -1);

    const cardNoData = createProjectCard({});
    assert("createProjectCard tolerates missing data", cardNoData instanceof HTMLElement);

    const page = createPostPage(samplePost);
    assert("createPostPage returns a DocumentFragment", page instanceof DocumentFragment);

    const probe = document.createElement("div");
    probe.appendChild(page.cloneNode(true));
    assert("post page contains title", probe.textContent.indexOf("Hello World") !== -1);
    assert("post page contains date", probe.textContent.indexOf("2026-07-12") !== -1);
    assert("post page contains a tag", probe.textContent.indexOf("intro") !== -1);

    const heading = createSectionHeading("Recent Posts");
    assert("createSectionHeading returns an <h2>", heading instanceof HTMLElement && heading.tagName === "H2");
    assert("section heading text is set", heading.textContent === "Recent Posts");

    const emptyState = createEmptyState("No posts yet.");
    assert("createEmptyState returns an element", emptyState instanceof HTMLElement);
    assert("empty state message is set", emptyState.textContent.indexOf("No posts yet.") !== -1);

    const failures = results.filter((result) => !result.passed);
    const passedCount = results.length - failures.length;

    console.log("[content-engine/templates] smoke test: " + passedCount + "/" + results.length + " passed");
    if (failures.length > 0) {
      console.warn("[content-engine/templates] failed assertions:", failures);
    }

    return { results: results, passed: failures.length === 0 };
  }

  globalScope.ContentEngineTemplates = {
    createPostListItem: createPostListItem,
    createProjectCard: createProjectCard,
    createPostPage: createPostPage,
    createSectionHeading: createSectionHeading,
    createEmptyState: createEmptyState,
    runTemplatesSmokeTest: runTemplatesSmokeTest
  };

  if (typeof window !== "undefined" && typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        runTemplatesSmokeTest();
      });
    } else {
      runTemplatesSmokeTest();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
