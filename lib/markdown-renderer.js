(function (globalScope) {
  "use strict";

  function render(markdown) {
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

  function renderMarkdownToHtml(markdown) {
    return render(markdown);
  }

  globalScope.MarkdownRenderer = {
    render,
    renderMarkdownToHtml
  };
})(typeof window !== "undefined" ? window : globalThis);
