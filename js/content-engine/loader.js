(function (globalScope) {
  "use strict";

  const CONTENT_ROOT = "content";

  // Capture the loader script's own URL synchronously at evaluation time.
  // document.currentScript is only non-null during synchronous script
  // execution; by the time async callers (e.g. router.getCollection) invoke
  // getSiteRoot(), it is null. Caching the src here makes site-root
  // resolution independent of when the loader is called.
  const SCRIPT_ORIGIN_SRC = (function () {
    if (typeof document !== "undefined" && document.currentScript && document.currentScript.src) {
      return document.currentScript.src;
    }
    return null;
  })();

  function getSiteRoot() {
    if (SCRIPT_ORIGIN_SRC) {
      return new URL("../../", SCRIPT_ORIGIN_SRC).toString();
    }

    if (typeof window !== "undefined" && window.location) {
      return new URL(".", window.location.href).toString();
    }

    return "/";
  }

  function getCollectionManifestUrl(collectionName) {
    return new URL(`${CONTENT_ROOT}/${collectionName}/manifest.json`, getSiteRoot());
  }

  async function readTextFile(url) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`);
    }

    return response.text();
  }

  async function loadCollection(collectionName) {
    if (!collectionName) {
      throw new Error("A collection name is required.");
    }

    const manifestUrl = getCollectionManifestUrl(collectionName);

    let manifestText;

    try {
      manifestText = await readTextFile(manifestUrl);
    } catch (error) {
      console.warn(`[content-engine] Unable to load manifest for "${collectionName}".`, error);
      return [];
    }

    let manifest;

    try {
      manifest = JSON.parse(manifestText);
    } catch (error) {
      console.warn(`[content-engine] Invalid manifest for "${collectionName}".`, error);
      return [];
    }

    if (!Array.isArray(manifest)) {
      console.warn(`[content-engine] Manifest for "${collectionName}" must be an array.`);
      return [];
    }

    const loadedItems = await Promise.all(
      manifest.map(async (item) => {
        const slug = item && typeof item.slug === "string" ? item.slug : "";
        const entryPath = item && typeof item.entry === "string" ? item.entry : "";
        const entryUrl = entryPath ? new URL(entryPath, manifestUrl) : null;

        if (!entryUrl) {
          return { slug, rawMarkdown: "", entryPath, error: "Missing entry path" };
        }

        try {
          const rawMarkdown = await readTextFile(entryUrl);
          return { slug, rawMarkdown, entryPath };
        } catch (error) {
          console.warn(`[content-engine] Unable to load entry "${slug}" from ${entryPath}.`, error);
          return { slug, rawMarkdown: "", entryPath, error: error.message };
        }
      })
    );

    return loadedItems;
  }

  async function runLoaderSmokeTest() {
    const collection = await loadCollection("posts");
    console.log("[content-engine] loaded collection:", collection);
    return collection;
  }

  globalScope.ContentEngineLoader = {
    loadCollection,
    runLoaderSmokeTest
  };

  if (typeof window !== "undefined" && typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        void runLoaderSmokeTest();
      });
    } else {
      void runLoaderSmokeTest();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
