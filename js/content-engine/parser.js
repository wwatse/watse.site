(function (globalScope) {
  "use strict";

  function getFrontmatterBoundary(rawMarkdown) {
    if (typeof rawMarkdown !== "string") {
      return null;
    }

    const lines = rawMarkdown.split(/\r?\n/);
    if (lines.length === 0 || lines[0].trim() !== "---") {
      return null;
    }

    for (let index = 1; index < lines.length; index += 1) {
      if (lines[index].trim() === "---") {
        return {
          start: 1,
          end: index
        };
      }
    }

    return null;
  }

  function parseFrontmatter(frontmatterText) {
    const metadata = {};

    if (typeof frontmatterText !== "string") {
      return metadata;
    }

    const lines = frontmatterText.split(/\r?\n/);

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        return;
      }

      const separatorIndex = line.indexOf(":");
      if (separatorIndex === -1) {
        return;
      }

      const key = line.slice(0, separatorIndex).trim();
      if (!key) {
        return;
      }

      const rawValue = line.slice(separatorIndex + 1);
      const value = rawValue.replace(/^\s+/, "");

      metadata[key] = value;
    });

    return metadata;
  }

  function splitMarkdown(rawMarkdown) {
    const boundary = getFrontmatterBoundary(rawMarkdown);
    if (!boundary) {
      return {
        metadata: {},
        body: rawMarkdown,
        raw: rawMarkdown
      };
    }

    const lines = rawMarkdown.split(/\r?\n/);
    const frontmatterLines = lines.slice(boundary.start, boundary.end);
    const markdownLines = lines.slice(boundary.end + 1);

    const metadata = parseFrontmatter(frontmatterLines.join("\n"));
    const body = markdownLines.join("\n").trim();

    return {
      metadata,
      body,
      raw: rawMarkdown
    };
  }

  function parseMarkdown(rawMarkdown, slug = "") {
    const parsedDocument = splitMarkdown(rawMarkdown);

    return {
      slug: slug || "",
      metadata: parsedDocument.metadata,
      body: parsedDocument.body,
      raw: parsedDocument.raw
    };
  }

  globalScope.ContentEngineParser = {
    parseMarkdown
  };
})(typeof window !== "undefined" ? window : globalThis);
