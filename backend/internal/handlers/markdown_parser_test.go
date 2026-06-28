package handlers

import (
	"testing"
)

func TestMarkdownToHTML(t *testing.T) {
	tests := []struct {
		name     string
		markdown string
		expected string
	}{
		{
			name:     "simple paragraph",
			markdown: "Hello World",
			expected: "<p>Hello World</p>",
		},
		{
			name:     "headings level 1-3",
			markdown: "# Heading 1\n## Heading 2\n### Heading 3",
			expected: "<h1>Heading 1</h1>\n<h2>Heading 2</h2>\n<h3>Heading 3</h3>",
		},
		{
			name:     "bold and italic inline",
			markdown: "This is **bold** and *italic* content.",
			expected: "<p>This is <strong>bold</strong> and <em>italic</em> content.</p>",
		},
		{
			name:     "inline code",
			markdown: "Use `go test` to run tests.",
			expected: "<p>Use <code>go test</code> to run tests.</p>",
		},
		{
			name:     "unordered list",
			markdown: "- Item 1\n- Item 2",
			expected: "<ul><li><p>Item 1</p></li><li><p>Item 2</p></li></ul>",
		},
		{
			name:     "ordered list",
			markdown: "1. First\n2. Second",
			expected: "<ol><li><p>First</p></li><li><p>Second</p></li></ol>",
		},
		{
			name:     "taskList checked and unchecked",
			markdown: "- [x] Done\n- [ ] Todo",
			expected: `<ul data-type="taskList"><li data-type="taskItem" data-checked="true"><p>Done</p></li><li data-type="taskItem" data-checked="false"><p>Todo</p></li></ul>`,
		},
		{
			name:     "code block with language",
			markdown: "```go\npackage main\n```",
			expected: `<pre data-language="go"><code>package main</code></pre>`,
		},
		{
			name:     "table parsing",
			markdown: "| Col 1 | Col 2 |\n|---|---|\n| Val 1 | Val 2 |",
			expected: `<div class="table-wrapper my-6 overflow-x-auto rounded-lg group relative" data-type="table-container"><table class="w-full table-auto border-collapse"><thead><tr class="border-b border-border"><th class="border border-border bg-background/40 p-2 font-bold text-left min-w-[100px] relative group">Col 1</th><th class="border border-border bg-background/40 p-2 font-bold text-left min-w-[100px] relative group">Col 2</th></tr></thead><tbody><tr class="border-b border-border"><td class="relative min-w-[100px] border border-border p-2 align-top">Val 1</td><td class="relative min-w-[100px] border border-border p-2 align-top">Val 2</td></tr></tbody></table></div>`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			actual := markdownToHTML(tt.markdown)
			if actual != tt.expected {
				t.Errorf("expected:\n%s\ngot:\n%s", tt.expected, actual)
			}
		})
	}
}
