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

  function renderMarkdownToHtml(markdown) {
    if (typeof globalScope.MarkdownRenderer !== "undefined" && typeof globalScope.MarkdownRenderer.render === "function") {
      return globalScope.MarkdownRenderer.render(markdown);
    }

    if (typeof markdown !== "string") {
      return "";
    }

    const normalizedMarkdown = markdown.trim();
    if (!normalizedMarkdown) {
      return "";
    }

    const paragraphs = normalizedMarkdown.split(/\n{2,}/).filter(Boolean);
    return paragraphs
      .map((paragraph) => {
        const trimmedParagraph = paragraph.trim();
        if (/^#{1,6}\s/.test(trimmedParagraph)) {
          const level = trimmedParagraph.match(/^(#{1,6})/)[1].length;
          const text = trimmedParagraph.replace(/^#{1,6}\s/, "");
          return `<h${level}>${text}</h${level}>`;
        }

        if (/^```/.test(trimmedParagraph)) {
          const codeBlock = trimmedParagraph.replace(/^```[\w-]*\s*/, "").replace(/```$/, "");
          return `<pre><code>${codeBlock}</code></pre>`;
        }

        if (/^[-*+]\s/.test(trimmedParagraph)) {
          const items = trimmedParagraph
            .split(/\n/)
            .filter((line) => /^[-*+]\s/.test(line.trim()))
            .map((line) => `<li>${line.replace(/^[-*+]\s/, "")}</li>`);
          return `<ul>${items.join("")}</ul>`;
        }

        const htmlParagraph = trimmedParagraph
          .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
          .replace(/\*(.+?)\*/g, "<em>$1</em>")
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

        return `<p>${htmlParagraph}</p>`;
      })
      .join("");
  }

  function parseMarkdown(rawMarkdown, slug = "") {
    const parsedDocument = splitMarkdown(rawMarkdown);

    return {
      slug: slug || "",
      metadata: parsedDocument.metadata,
      body: parsedDocument.body,
      html: renderMarkdownToHtml(parsedDocument.body),
      raw: parsedDocument.raw
    };
  }

  async function runParserSmokeTest() {
    if (typeof fetch !== "function") {
      return null;
    }

    try {
      const response = await fetch("content/posts/hello-world/index.md");
      if (!response.ok) {
        throw new Error(`Failed to load hello-world markdown: ${response.status} ${response.statusText}`);
      }

      const rawMarkdown = await response.text();
      const parsedDocument = parseMarkdown(rawMarkdown, "hello-world");
      console.log("[content-engine] parsed markdown:", parsedDocument);
      return parsedDocument;
    } catch (error) {
      console.warn("[content-engine] Unable to run parser smoke test.", error);
      return null;
    }
  }

  globalScope.ContentEngineParser = {
    parseMarkdown,
    renderMarkdownToHtml,
    runParserSmokeTest
  };

  if (typeof window !== "undefined" && typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        void runParserSmokeTest();
      });
    } else {
      void runParserSmokeTest();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
