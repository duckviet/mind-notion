function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function parseInline(text: string): string {
  let html = escapeHtml(text);

  // 1. Temporarily extract inline code blocks
  const inlineCodes: string[] = [];
  html = html.replace(/`([^`]+)`/g, (_, code) => {
    inlineCodes.push(code);
    return `%%INLINECODE${inlineCodes.length - 1}%%`;
  });

  // 2. Links: [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, linkText, url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
  });

  // 3. Bold: **text** or __text__
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__([^_]+)__/g, "<strong>$1</strong>");

  // 4. Italic: *text* or _text_
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/_([^_]+)_/g, "<em>$1</em>");

  // 5. Restore inline codes
  html = html.replace(/%%INLINECODE(\d+)%%/g, (_, index) => {
    const rawCode = inlineCodes[parseInt(index, 10)];
    return `<code>${rawCode}</code>`;
  });

  return html;
}

function parseTableBlock(lines: string[]): string {
  if (lines.length === 0) return "";

  const parseRowCells = (line: string) => {
    const rawCells = line.replace(/^\|/, "").replace(/\|$/, "").split("|");
    return rawCells.map((c) => c.trim());
  };

  const rows = lines.map(parseRowCells);
  let html = `<div class="table-wrapper my-6 overflow-x-auto rounded-lg group relative" data-type="table-container">`;
  html += `<table class="w-full table-auto border-collapse">`;

  const hasHeader = rows.length > 1;

  if (hasHeader) {
    html += '<thead><tr class="border-b border-border">';
    rows[0].forEach((cell) => {
      html += `<th class="border border-border bg-background/40 p-2 font-bold text-left min-w-[100px] relative group">${parseInline(
        cell,
      )}</th>`;
    });
    html += "</tr></thead>";

    html += "<tbody>";
    for (let i = 1; i < rows.length; i++) {
      html += '<tr class="border-b border-border">';
      rows[i].forEach((cell) => {
        html += `<td class="relative min-w-[100px] border border-border p-2 align-top">${parseInline(
          cell,
        )}</td>`;
      });
      html += "</tr>";
    }
    html += "</tbody>";
  } else {
    html += "<tbody>";
    rows.forEach((row) => {
      html += '<tr class="border-b border-border">';
      row.forEach((cell) => {
        html += `<td class="relative min-w-[100px] border border-border p-2 align-top">${parseInline(
          cell,
        )}</td>`;
      });
      html += "</tr>";
    });
    html += "</tbody>";
  }

  html += "</table></div>";
  return html;
}

export function markdownToHtml(markdown: string): string {
  if (!markdown) return "";

  const lines = markdown.split(/\r?\n/);
  const htmlBlocks: string[] = [];

  let currentBlockType:
    | "paragraph"
    | "blockquote"
    | "list"
    | "code"
    | "table"
    | null = null;
  let currentBlockContent: string[] = [];
  let codeLanguage = "";

  const closeCurrentBlock = () => {
    if (!currentBlockType) return;

    if (currentBlockType === "code") {
      const escapedCode = escapeHtml(currentBlockContent.join("\n"));
      htmlBlocks.push(
        `<pre data-language="${
          codeLanguage || "plaintext"
        }"><code>${escapedCode}</code></pre>`,
      );
    } else if (currentBlockType === "paragraph") {
      const content = parseInline(currentBlockContent.join("\n").trim());
      if (content) {
        htmlBlocks.push(`<p>${content}</p>`);
      }
    } else if (currentBlockType === "blockquote") {
      const content = parseInline(currentBlockContent.join("\n").trim());
      htmlBlocks.push(`<blockquote><p>${content}</p></blockquote>`);
    } else if (currentBlockType === "table") {
      htmlBlocks.push(parseTableBlock(currentBlockContent));
    } else if (currentBlockType === "list") {
      htmlBlocks.push(parseListBlock(currentBlockContent));
    }

    currentBlockType = null;
    currentBlockContent = [];
  };

  const parseListBlock = (listLines: string[]): string => {
    let html = "";
    const listStack: {
      type: "ul" | "ol" | "taskList";
      indent: number;
    }[] = [];

    const openList = (t: "ul" | "ol" | "taskList") => {
      if (t === "taskList") return '<ul data-type="taskList">';
      if (t === "ol") return "<ol>";
      return "<ul>";
    };

    const closeList = (t: "ul" | "ol" | "taskList") => {
      if (t === "taskList") return "</ul>";
      if (t === "ol") return "</ol>";
      return "</ul>";
    };

    listLines.forEach((line) => {
      const taskMatch = line.match(/^(\s*)[-*+]\s+\[([ xX])\]\s+(.*)$/);
      const ulMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
      const olMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);

      let indent = 0;
      let type: "ul" | "ol" | "taskList" = "ul";
      let text = "";
      let checked = false;

      if (taskMatch) {
        indent = taskMatch[1].length;
        type = "taskList";
        checked = taskMatch[2].toLowerCase() === "x";
        text = taskMatch[3];
      } else if (ulMatch) {
        indent = ulMatch[1].length;
        type = "ul";
        text = ulMatch[2];
      } else if (olMatch) {
        indent = olMatch[1].length;
        type = "ol";
        text = olMatch[2];
      } else {
        // Line doesn't match list format, render as plain inline content of the last list item
        if (listStack.length > 0) {
          html += " " + parseInline(line.trim());
        }
        return;
      }

      // Check hierarchy
      if (listStack.length === 0) {
        listStack.push({ type, indent });
        html += openList(type);
      } else {
        const top = listStack[listStack.length - 1];
        if (indent > top.indent) {
          listStack.push({ type, indent });
          html += openList(type);
        } else if (indent < top.indent) {
          while (listStack.length > 0 && listStack[listStack.length - 1].indent > indent) {
            const popped = listStack.pop();
            if (popped) html += closeList(popped.type);
          }
          if (listStack.length === 0 || listStack[listStack.length - 1].indent < indent) {
            listStack.push({ type, indent });
            html += openList(type);
          } else if (listStack[listStack.length - 1].type !== type) {
            const popped = listStack.pop();
            if (popped) html += closeList(popped.type);
            listStack.push({ type, indent });
            html += openList(type);
          }
        } else if (top.type !== type) {
          const popped = listStack.pop();
          if (popped) html += closeList(popped.type);
          listStack.push({ type, indent });
          html += openList(type);
        }
      }

      // Append list item
      if (type === "taskList") {
        html += `<li data-type="taskItem" data-checked="${
          checked ? "true" : "false"
        }"><p>${parseInline(text)}</p></li>`;
      } else {
        html += `<li><p>${parseInline(text)}</p></li>`;
      }
    });

    // Close remaining lists
    while (listStack.length > 0) {
      const popped = listStack.pop();
      if (popped) html += closeList(popped.type);
    }

    return html;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Code block handling
    if (currentBlockType === "code") {
      if (trimmed.startsWith("```")) {
        closeCurrentBlock();
      } else {
        currentBlockContent.push(line);
      }
      continue;
    }

    if (trimmed.startsWith("```")) {
      closeCurrentBlock();
      currentBlockType = "code";
      codeLanguage = trimmed.slice(3).trim();
      continue;
    }

    // 2. Empty line
    if (trimmed === "") {
      closeCurrentBlock();
      continue;
    }

    // 3. Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      closeCurrentBlock();
      const level = Math.min(4, headingMatch[1].length);
      const content = parseInline(headingMatch[2].trim());
      htmlBlocks.push(`<h${level}>${content}</h${level}>`);
      continue;
    }

    // 4. Blockquotes
    if (trimmed.startsWith(">")) {
      if (currentBlockType !== "blockquote") {
        closeCurrentBlock();
        currentBlockType = "blockquote";
      }
      const quoteText = line.slice(line.indexOf(">") + 1);
      currentBlockContent.push(
        quoteText.startsWith(" ") ? quoteText.slice(1) : quoteText,
      );
      continue;
    }

    // 5. Table rows
    if (
      trimmed.startsWith("|") &&
      trimmed.endsWith("|") &&
      trimmed.length > 1
    ) {
      const isDivider = /^\|\s*[:\-|\s]+$/.test(trimmed);
      if (isDivider) {
        if (currentBlockType === "table") {
          continue;
        }
      }
      if (currentBlockType !== "table") {
        closeCurrentBlock();
        currentBlockType = "table";
      }
      currentBlockContent.push(trimmed);
      continue;
    }

    // 6. List items
    const isListLine =
      /^\s*[-*+]\s+\[([ xX])\]\s+/.test(line) || // Task List
      /^\s*[-*+]\s+/.test(line) || // Unordered List
      /^\s*\d+\.\s+/.test(line); // Ordered List

    if (isListLine) {
      if (currentBlockType !== "list") {
        closeCurrentBlock();
        currentBlockType = "list";
      }
      currentBlockContent.push(line);
      continue;
    }

    // 7. Paragraph
    if (currentBlockType !== "paragraph") {
      closeCurrentBlock();
      currentBlockType = "paragraph";
    }
    currentBlockContent.push(line);
  }

  closeCurrentBlock();

  return htmlBlocks.join("");
}
