import { describe, expect, it } from "vitest";
import { markdownToHtml } from "@mind-notion/editor";

describe("markdownToHtml", () => {
  it("converts headings correctly", () => {
    expect(markdownToHtml("# Hello")).toBe("<h1>Hello</h1>");
    expect(markdownToHtml("## World")).toBe("<h2>World</h2>");
    expect(markdownToHtml("### Heading 3")).toBe("<h3>Heading 3</h3>");
    expect(markdownToHtml("#### Heading 4")).toBe("<h4>Heading 4</h4>");
    expect(markdownToHtml("##### Heading 5")).toBe("<h4>Heading 5</h4>");
  });

  it("converts inline formatting correctly", () => {
    expect(markdownToHtml("This is **bold** and *italic* and `code`.")).toBe(
      "<p>This is <strong>bold</strong> and <em>italic</em> and <code>code</code>.</p>",
    );
    expect(markdownToHtml("[Google](https://google.com)")).toBe(
      '<p><a href="https://google.com" target="_blank" rel="noopener noreferrer">Google</a></p>',
    );
  });

  it("converts blockquotes correctly", () => {
    expect(markdownToHtml("> Hello world")).toBe(
      "<blockquote><p>Hello world</p></blockquote>",
    );
  });

  it("converts code blocks correctly", () => {
    const md = "```typescript\nconst a = 1;\n```";
    expect(markdownToHtml(md)).toBe(
      '<pre data-language="typescript"><code>const a = 1;</code></pre>',
    );
  });

  it("converts bullet lists and nested bullet lists correctly", () => {
    const md = "- item 1\n- item 2\n  - item 2.1";
    expect(markdownToHtml(md)).toBe(
      "<ul><li><p>item 1</p></li><li><p>item 2</p></li><ul><li><p>item 2.1</p></li></ul></ul>",
    );
  });

  it("converts ordered lists correctly", () => {
    const md = "1. First\n2. Second";
    expect(markdownToHtml(md)).toBe(
      "<ol><li><p>First</p></li><li><p>Second</p></li></ol>",
    );
  });

  it("converts task lists correctly", () => {
    const md = "- [ ] Task 1\n- [x] Task 2";
    expect(markdownToHtml(md)).toBe(
      '<ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p>Task 1</p></li><li data-type="taskItem" data-checked="true"><p>Task 2</p></li></ul>',
    );
  });

  it("converts tables correctly", () => {
    const md = "| A | B |\n|---|---|\n| 1 | 2 |";
    const expected =
      '<div class="table-wrapper my-6 overflow-x-auto rounded-lg group relative" data-type="table-container"><table class="w-full table-auto border-collapse"><thead><tr class="border-b border-border"><th class="border border-border bg-background/40 p-2 font-bold text-left min-w-[100px] relative group">A</th><th class="border border-border bg-background/40 p-2 font-bold text-left min-w-[100px] relative group">B</th></tr></thead><tbody><tr class="border-b border-border"><td class="relative min-w-[100px] border border-border p-2 align-top">1</td><td class="relative min-w-[100px] border border-border p-2 align-top">2</td></tr></tbody></table></div>';
    expect(markdownToHtml(md)).toBe(expected);
  });
});
