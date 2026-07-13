(function (globalScope) {
  "use strict";

  function sortByDate(items, order = "desc") {
    if (!Array.isArray(items)) {
      return [];
    }

    const normalizedOrder = String(order).toLowerCase();
    const sortedItems = [...items].sort((left, right) => {
      const leftDate = new Date(left && left.metadata && left.metadata.date ? left.metadata.date : 0).getTime();
      const rightDate = new Date(right && right.metadata && right.metadata.date ? right.metadata.date : 0).getTime();
      return leftDate - rightDate;
    });

    return normalizedOrder === "asc" ? sortedItems : sortedItems.reverse();
  }

  function filterFeatured(items) {
    if (!Array.isArray(items)) {
      return [];
    }

    return items.filter((item) => {
      const metadata = item && item.metadata ? item.metadata : {};
      return metadata.featured === "true" || metadata.featured === true;
    });
  }

  function getLatest(items, count = 1) {
    if (!Array.isArray(items)) {
      return [];
    }

    const limit = Math.max(0, Number(count) || 0);
    return sortByDate(items, "desc").slice(0, limit);
  }

  function findBySlug(items, slug) {
    if (!Array.isArray(items)) {
      return null;
    }

    if (typeof slug !== "string" || !slug) {
      return null;
    }

    return items.find((item) => item && item.slug === slug) || null;
  }

  function groupByYear(items) {
    if (!Array.isArray(items)) {
      return {};
    }

    return items.reduce((groups, item) => {
      const metadata = item && item.metadata ? item.metadata : {};
      const rawDate = metadata.date;
      const year = rawDate ? new Date(rawDate).getFullYear() : "unknown";
      const key = Number.isNaN(year) ? "unknown" : String(year);

      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(item);
      return groups;
    }, {});
  }

  async function runTransformSmokeTest() {
    if (typeof globalScope.ContentEngineLoader === "undefined" || typeof globalScope.ContentEngineParser === "undefined") {
      return null;
    }

    try {
      const collection = await globalScope.ContentEngineLoader.loadCollection("posts");
      const parsedItems = collection
        .filter((item) => item && typeof item.rawMarkdown === "string" && item.rawMarkdown.trim())
        .map((item) => globalScope.ContentEngineParser.parseMarkdown(item.rawMarkdown, item.slug));

      const sortedItems = sortByDate(parsedItems, "desc");
      const latestItems = getLatest(parsedItems, 3);

      console.log("[content-engine] transformed collection:", {
        parsedItems,
        sortedItems,
        latestItems
      });

      return {
        parsedItems,
        sortedItems,
        latestItems
      };
    } catch (error) {
      console.warn("[content-engine] Unable to run transform smoke test.", error);
      return null;
    }
  }

  globalScope.ContentEngineTransform = {
    sortByDate,
    filterFeatured,
    getLatest,
    findBySlug,
    groupByYear,
    runTransformSmokeTest
  };

  if (typeof window !== "undefined" && typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        void runTransformSmokeTest();
      });
    } else {
      void runTransformSmokeTest();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
