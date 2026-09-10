(function (globalScope) {
  "use strict";

  // ---------------------------------------------------------------------------
  // Dependency resolution
  // ---------------------------------------------------------------------------

  function assertDependency(name, value) {
    if (!value || typeof value !== "object") {
      throw new Error("[content-engine/router] Missing dependency: " + name);
    }
  }

  // Resolve all engine modules lazily so router.js can be loaded in any order
  // relative to the other scripts, and so a missing module surfaces as a clear
  // error at call time rather than silently producing empty data.
  function getDependencies() {
    const loader = globalScope.ContentEngineLoader;
    const parser = globalScope.ContentEngineParser;
    const transform = globalScope.ContentEngineTransform;
    const templates = globalScope.ContentEngineTemplates;
    const markdownRenderer = globalScope.MarkdownRenderer;

    assertDependency("ContentEngineLoader", loader);
    assertDependency("ContentEngineParser", parser);
    assertDependency("ContentEngineTransform", transform);
    assertDependency("ContentEngineTemplates", templates);
    assertDependency("MarkdownRenderer", markdownRenderer);

    return {
      loader: loader,
      parser: parser,
      transform: transform,
      templates: templates,
      markdownRenderer: markdownRenderer
    };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  // Loader items that failed (missing entry, fetch error) arrive with an empty
  // rawMarkdown string. Drop them so downstream stages never see half-objects.
  function isUsableLoadedItem(item) {
    return Boolean(
      item &&
      typeof item === "object" &&
      typeof item.rawMarkdown === "string" &&
      item.rawMarkdown.trim() !== ""
    );
  }

  async function loadAndParse(collectionName) {
    const deps = getDependencies();
    const rawItems = await deps.loader.loadCollection(collectionName);

    if (!Array.isArray(rawItems)) {
      return [];
    }

    return rawItems
      .filter(isUsableLoadedItem)
      .map(function (item) {
        return deps.parser.parseMarkdown(item.rawMarkdown, item.slug);
      });
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  async function getCollection(collectionName) {
    return loadAndParse(collectionName);
  }

  async function getSortedCollection(collectionName, order) {
    const deps = getDependencies();
    const normalizedOrder = typeof order === "string" && order ? order : "desc";
    const parsedItems = await loadAndParse(collectionName);
    return deps.transform.sortByDate(parsedItems, normalizedOrder);
  }

  async function getItemBySlug(collectionName, slug) {
    const deps = getDependencies();
    const parsedItems = await loadAndParse(collectionName);
    return deps.transform.findBySlug(parsedItems, slug);
  }

  async function getFeaturedItems(collectionName) {
    const deps = getDependencies();
    const parsedItems = await loadAndParse(collectionName);
    return deps.transform.filterFeatured(parsedItems);
  }

  async function getLatestItems(collectionName, count) {
    const deps = getDependencies();
    const limit = typeof count === "number" ? count : 3;
    const parsedItems = await loadAndParse(collectionName);
    return deps.transform.getLatest(parsedItems, limit);
  }

  async function renderItemPage(collectionName, slug) {
    const deps = getDependencies();
    const item = await getItemBySlug(collectionName, slug);

    if (!item) {
      return deps.templates.createEmptyState("Item not found");
    }

    let renderedHtml = "";

    try {
      renderedHtml = deps.markdownRenderer.render(item.body) || "";
    } catch (error) {
      console.warn(
        "[content-engine/router] MarkdownRenderer failed for " + collectionName + "/" + slug + ".",
        error
      );
      renderedHtml = "";
    }

    // Pass renderedHtml explicitly so templates.js does not re-render the body.
    const postWithHtml = Object.assign({}, item, { renderedHtml: renderedHtml });
    return deps.templates.createPostPage(postWithHtml);
  }

  // ---------------------------------------------------------------------------
  // Smoke test
  // ---------------------------------------------------------------------------

  async function runRouterSmokeTest() {
    const results = [];

    function assert(name, condition) {
      results.push({ name: name, passed: Boolean(condition) });
    }

    function recordError(name, error) {
      results.push({
        name: name,
        passed: false,
        error: error && error.message ? error.message : String(error)
      });
    }

    // 1. getCollection --------------------------------------------------------
    try {
      const collection = await getCollection("posts");
      assert("getCollection returns an array", Array.isArray(collection));
      assert("getCollection returns at least one item", collection.length > 0);

      if (collection.length > 0) {
        const first = collection[0];
        assert("collection item has string slug", typeof first.slug === "string" && first.slug.length > 0);
        assert("collection item has metadata object", Boolean(first.metadata) && typeof first.metadata === "object");
        assert("collection item has string body", typeof first.body === "string");
      }
    } catch (error) {
      recordError("getCollection did not throw", error);
    }

    // 2. getSortedCollection --------------------------------------------------
    try {
      const sorted = await getSortedCollection("posts", "desc");
      assert("getSortedCollection returns an array", Array.isArray(sorted));

      if (sorted.length > 1) {
        const firstDate = sorted[0].metadata && sorted[0].metadata.date
          ? new Date(sorted[0].metadata.date).getTime()
          : 0;
        const secondDate = sorted[1].metadata && sorted[1].metadata.date
          ? new Date(sorted[1].metadata.date).getTime()
          : 0;
        assert("getSortedCollection is descending", firstDate >= secondDate);
      } else {
        assert("getSortedCollection is descending (single item)", true);
      }
    } catch (error) {
      recordError("getSortedCollection did not throw", error);
    }

    // 3. getItemBySlug (existing) ---------------------------------------------
    try {
      const item = await getItemBySlug("posts", "hello-world");
      assert("getItemBySlug finds existing slug", Boolean(item));
      if (item) {
        assert("getItemBySlug returns the requested slug", item.slug === "hello-world");
      }
    } catch (error) {
      recordError("getItemBySlug (existing) did not throw", error);
    }

    // 4. getItemBySlug (missing) ----------------------------------------------
    try {
      const missing = await getItemBySlug("posts", "does-not-exist-xyz");
      assert("getItemBySlug returns null for missing slug", missing === null);
    } catch (error) {
      recordError("getItemBySlug (missing) did not throw", error);
    }

    // 5. getFeaturedItems -----------------------------------------------------
    try {
      const featured = await getFeaturedItems("posts");
      assert("getFeaturedItems returns an array", Array.isArray(featured));

      const allFeatured = featured.every(function (item) {
        const meta = item && item.metadata ? item.metadata : {};
        return meta.featured === "true" || meta.featured === true;
      });
      assert("getFeaturedItems only returns featured items", allFeatured);
    } catch (error) {
      recordError("getFeaturedItems did not throw", error);
    }

    // 6. getLatestItems -------------------------------------------------------
    try {
      const latest = await getLatestItems("posts", 3);
      assert("getLatestItems returns an array", Array.isArray(latest));
      assert("getLatestItems respects count limit", latest.length <= 3);

      const latestDefault = await getLatestItems("posts");
      assert("getLatestItems defaults to 3", Array.isArray(latestDefault) && latestDefault.length <= 3);
    } catch (error) {
      recordError("getLatestItems did not throw", error);
    }

    // 7. renderItemPage (existing) --------------------------------------------
    try {
      const fragment = await renderItemPage("posts", "hello-world");
      assert("renderItemPage returns a DocumentFragment", fragment instanceof DocumentFragment);

      if (fragment instanceof DocumentFragment) {
        const probe = document.createElement("div");
        probe.appendChild(fragment.cloneNode(true));
        assert("renderItemPage contains post title", probe.textContent.indexOf("Hello World") !== -1);
        assert("renderItemPage contains post body text", probe.textContent.indexOf("first Markdown post") !== -1);
      }
    } catch (error) {
      recordError("renderItemPage (existing) did not throw", error);
    }

    // 8. renderItemPage (missing) ---------------------------------------------
    try {
      const missing = await renderItemPage("posts", "does-not-exist-xyz");
      const isNode = missing instanceof HTMLElement || missing instanceof DocumentFragment;
      assert("renderItemPage returns a DOM node for missing slug", isNode);

      if (isNode) {
        const probe = document.createElement("div");
        probe.appendChild(missing.cloneNode(true));
        assert(
          "renderItemPage empty state mentions not found",
          probe.textContent.toLowerCase().indexOf("not found") !== -1
        );
      }
    } catch (error) {
      recordError("renderItemPage (missing) did not throw", error);
    }

    const failures = results.filter(function (r) { return !r.passed; });
    const passedCount = results.length - failures.length;

    console.log("[content-engine/router] smoke test: " + passedCount + "/" + results.length + " passed");
    if (failures.length > 0) {
      console.warn("[content-engine/router] failed assertions:", failures);
    }

    return { results: results, passed: failures.length === 0 };
  }

  // ---------------------------------------------------------------------------
  // Exports
  // ---------------------------------------------------------------------------

  globalScope.ContentEngineRouter = {
    getCollection: getCollection,
    getSortedCollection: getSortedCollection,
    getItemBySlug: getItemBySlug,
    getFeaturedItems: getFeaturedItems,
    getLatestItems: getLatestItems,
    renderItemPage: renderItemPage,
    runRouterSmokeTest: runRouterSmokeTest
  };

  if (typeof window !== "undefined" && typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        void runRouterSmokeTest();
      });
    } else {
      void runRouterSmokeTest();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
