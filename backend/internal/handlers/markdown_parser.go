package handlers

import (
	"fmt"
	"html"
	"regexp"
	"strings"
)

var (
	inlineCodeReg = regexp.MustCompile("`([^`]+)`")
	linkReg       = regexp.MustCompile(`\[([^\]]+)\]\(([^)]+)\)`)
	boldReg1      = regexp.MustCompile(`\*\*([^*]+)\*\*`)
	boldReg2      = regexp.MustCompile(`__([^_]+)__`)
	italicReg1    = regexp.MustCompile(`\*([^*]+)\*`)
	italicReg2    = regexp.MustCompile(`_([^_]+)_`)

	taskItemReg = regexp.MustCompile(`^(\s*)[-*+]\s+\[([ xX])\]\s+(.*)$`)
	ulReg       = regexp.MustCompile(`^(\s*)[-*+]\s+(.*)$`)
	olReg       = regexp.MustCompile(`^(\s*)\d+\.\s+(.*)$`)
)

func parseInline(text string) string {
	escaped := html.EscapeString(text)

	// 1. Temporarily extract inline code blocks
	var inlineCodes []string
	escaped = inlineCodeReg.ReplaceAllStringFunc(escaped, func(m string) string {
		match := inlineCodeReg.FindStringSubmatch(m)
		if len(match) > 1 {
			inlineCodes = append(inlineCodes, match[1])
			return fmt.Sprintf("%%%%INLINECODE%d%%%%", len(inlineCodes)-1)
		}
		return m
	})

	// 2. Links: [text](url)
	escaped = linkReg.ReplaceAllString(escaped, `<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>`)

	// 3. Bold: **text** or __text__
	escaped = boldReg1.ReplaceAllString(escaped, "<strong>$1</strong>")
	escaped = boldReg2.ReplaceAllString(escaped, "<strong>$1</strong>")

	// 4. Italic: *text* or _text_
	escaped = italicReg1.ReplaceAllString(escaped, "<em>$1</em>")
	escaped = italicReg2.ReplaceAllString(escaped, "<em>$1</em>")

	// 5. Restore inline codes
	restoreReg := regexp.MustCompile(`%%INLINECODE(\d+)%%`)
	escaped = restoreReg.ReplaceAllStringFunc(escaped, func(m string) string {
		match := restoreReg.FindStringSubmatch(m)
		if len(match) > 1 {
			var idx int
			fmt.Sscanf(match[1], "%d", &idx)
			if idx >= 0 && idx < len(inlineCodes) {
				return fmt.Sprintf("<code>%s</code>", inlineCodes[idx])
			}
		}
		return m
	})

	return escaped
}

func parseTableBlock(lines []string) string {
	if len(lines) == 0 {
		return ""
	}

	parseRowCells := func(line string) []string {
		trimmed := strings.TrimSpace(line)
		trimmed = strings.TrimPrefix(trimmed, "|")
		trimmed = strings.TrimSuffix(trimmed, "|")
		rawCells := strings.Split(trimmed, "|")
		cells := make([]string, len(rawCells))
		for i, c := range rawCells {
			cells[i] = strings.TrimSpace(c)
		}
		return cells
	}

	var rows [][]string
	for _, line := range lines {
		rows = append(rows, parseRowCells(line))
	}

	var sb strings.Builder
	sb.WriteString(`<div class="table-wrapper my-6 overflow-x-auto rounded-lg group relative" data-type="table-container">`)
	sb.WriteString(`<table class="w-full table-auto border-collapse">`)

	hasHeader := len(rows) > 1

	if hasHeader {
		sb.WriteString("<thead><tr class=\"border-b border-border\">")
		for _, cell := range rows[0] {
			sb.WriteString(fmt.Sprintf(`<th class="border border-border bg-background/40 p-2 font-bold text-left min-w-[100px] relative group">%s</th>`, parseInline(cell)))
		}
		sb.WriteString("</tr></thead>")

		sb.WriteString("<tbody>")
		for i := 1; i < len(rows); i++ {
			sb.WriteString("<tr class=\"border-b border-border\">")
			for _, cell := range rows[i] {
				sb.WriteString(fmt.Sprintf(`<td class="relative min-w-[100px] border border-border p-2 align-top">%s</td>`, parseInline(cell)))
			}
			sb.WriteString("</tr>")
		}
		sb.WriteString("</tbody>")
	} else {
		sb.WriteString("<tbody>")
		for _, row := range rows {
			sb.WriteString("<tr class=\"border-b border-border\">")
			for _, cell := range row {
				sb.WriteString(fmt.Sprintf(`<td class="relative min-w-[100px] border border-border p-2 align-top">%s</td>`, parseInline(cell)))
			}
			sb.WriteString("</tr>")
		}
		sb.WriteString("</tbody>")
	}

	sb.WriteString("</table></div>")
	return sb.String()
}

type listState struct {
	listType string // "ul", "ol", "taskList"
	indent   int
}

func parseListBlock(listLines []string) string {
	var sb strings.Builder
	var listStack []listState

	openList := func(t string) string {
		if t == "taskList" {
			return `<ul data-type="taskList">`
		}
		if t == "ol" {
			return "<ol>"
		}
		return "<ul>"
	}

	closeList := func(t string) string {
		if t == "taskList" {
			return "</ul>"
		}
		if t == "ol" {
			return "</ol>"
		}
		return "</ul>"
	}

	for _, line := range listLines {
		var indent int
		var listType string
		var text string
		var checked bool

		taskMatch := taskItemReg.FindStringSubmatch(line)
		ulMatch := ulReg.FindStringSubmatch(line)
		olMatch := olReg.FindStringSubmatch(line)

		if len(taskMatch) > 0 {
			indent = len(taskMatch[1])
			listType = "taskList"
			checked = strings.ToLower(taskMatch[2]) == "x"
			text = taskMatch[3]
		} else if len(ulMatch) > 0 {
			indent = len(ulMatch[1])
			listType = "ul"
			text = ulMatch[2]
		} else if len(olMatch) > 0 {
			indent = len(olMatch[1])
			listType = "ol"
			text = olMatch[2]
		} else {
			// Line doesn't match list format, render as plain inline content of the last list item
			if len(listStack) > 0 {
				sb.WriteString(" " + parseInline(strings.TrimSpace(line)))
			}
			continue
		}

		// Check hierarchy
		if len(listStack) == 0 {
			listStack = append(listStack, listState{listType: listType, indent: indent})
			sb.WriteString(openList(listType))
		} else {
			top := listStack[len(listStack)-1]
			if indent > top.indent {
				listStack = append(listStack, listState{listType: listType, indent: indent})
				sb.WriteString(openList(listType))
			} else if indent < top.indent {
				for len(listStack) > 0 && listStack[len(listStack)-1].indent > indent {
					popped := listStack[len(listStack)-1]
					listStack = listStack[:len(listStack)-1]
					sb.WriteString(closeList(popped.listType))
				}
				if len(listStack) == 0 || listStack[len(listStack)-1].indent < indent {
					listStack = append(listStack, listState{listType: listType, indent: indent})
					sb.WriteString(openList(listType))
				} else if listStack[len(listStack)-1].listType != listType {
					popped := listStack[len(listStack)-1]
					listStack = listStack[:len(listStack)-1]
					sb.WriteString(closeList(popped.listType))
					listStack = append(listStack, listState{listType: listType, indent: indent})
					sb.WriteString(openList(listType))
				}
			} else if top.listType != listType {
				popped := listStack[len(listStack)-1]
				listStack = listStack[:len(listStack)-1]
				sb.WriteString(closeList(popped.listType))
				listStack = append(listStack, listState{listType: listType, indent: indent})
				sb.WriteString(openList(listType))
			}
		}

		// Append list item
		if listType == "taskList" {
			chkStr := "false"
			if checked {
				chkStr = "true"
			}
			sb.WriteString(fmt.Sprintf(`<li data-type="taskItem" data-checked="%s"><p>%s</p></li>`, chkStr, parseInline(text)))
		} else {
			sb.WriteString(fmt.Sprintf(`<li><p>%s</p></li>`, parseInline(text)))
		}
	}

	// Close remaining lists
	for len(listStack) > 0 {
		popped := listStack[len(listStack)-1]
		listStack = listStack[:len(listStack)-1]
		sb.WriteString(closeList(popped.listType))
	}

	return sb.String()
}

func markdownToHTML(markdown string) string {
	if markdown == "" {
		return ""
	}

	lines := strings.Split(strings.ReplaceAll(markdown, "\r\n", "\n"), "\n")
	var htmlBlocks []string

	var currentBlockType string // "", "paragraph", "blockquote", "list", "code", "table"
	var currentBlockContent []string
	var codeLanguage string

	closeCurrentBlock := func() {
		if currentBlockType == "" {
			return
		}

		switch currentBlockType {
		case "code":
			escapedCode := html.EscapeString(strings.Join(currentBlockContent, "\n"))
			lang := "plaintext"
			if codeLanguage != "" {
				lang = codeLanguage
			}
			htmlBlocks = append(htmlBlocks, fmt.Sprintf(`<pre data-language="%s"><code>%s</code></pre>`, lang, escapedCode))

		case "paragraph":
			content := parseInline(strings.TrimSpace(strings.Join(currentBlockContent, "\n")))
			if content != "" {
				htmlBlocks = append(htmlBlocks, fmt.Sprintf("<p>%s</p>", content))
			}

		case "blockquote":
			content := parseInline(strings.TrimSpace(strings.Join(currentBlockContent, "\n")))
			htmlBlocks = append(htmlBlocks, fmt.Sprintf("<blockquote><p>%s</p></blockquote>", content))

		case "table":
			htmlBlocks = append(htmlBlocks, parseTableBlock(currentBlockContent))

		case "list":
			htmlBlocks = append(htmlBlocks, parseListBlock(currentBlockContent))
		}

		currentBlockType = ""
		currentBlockContent = nil
		codeLanguage = ""
	}

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)

		// 1. Code block handling
		if currentBlockType == "code" {
			if strings.HasPrefix(trimmed, "```") {
				closeCurrentBlock()
			} else {
				currentBlockContent = append(currentBlockContent, line)
			}
			continue
		}

		if strings.HasPrefix(trimmed, "```") {
			closeCurrentBlock()
			currentBlockType = "code"
			codeLanguage = strings.TrimSpace(trimmed[3:])
			continue
		}

		// 2. Empty line
		if trimmed == "" {
			closeCurrentBlock()
			continue
		}

		// 3. Headings
		if strings.HasPrefix(line, "#") {
			// Count leading hashes
			hashes := 0
			for _, char := range line {
				if char == '#' {
					hashes++
				} else {
					break
				}
			}
			// Verify there is space after hashes
			if hashes >= 1 && hashes <= 6 && len(line) > hashes && line[hashes] == ' ' {
				closeCurrentBlock()
				level := hashes
				if level > 4 {
					level = 4
				}
				content := parseInline(strings.TrimSpace(line[hashes:]))
				htmlBlocks = append(htmlBlocks, fmt.Sprintf("<h%d>%s</h%d>", level, content, level))
				continue
			}
		}

		// 4. Blockquotes
		if strings.HasPrefix(trimmed, ">") {
			if currentBlockType != "blockquote" {
				closeCurrentBlock()
				currentBlockType = "blockquote"
			}
			quoteText := line[strings.Index(line, ">")+1:]
			if strings.HasPrefix(quoteText, " ") {
				quoteText = quoteText[1:]
			}
			currentBlockContent = append(currentBlockContent, quoteText)
			continue
		}

		// 5. Table rows
		if strings.HasPrefix(trimmed, "|") && strings.HasSuffix(trimmed, "|") && len(trimmed) > 1 {
			// check divider
			isDivider := true
			for _, r := range trimmed {
				if r != '|' && r != ':' && r != '-' && r != ' ' && r != '\t' {
					isDivider = false
					break
				}
			}
			if isDivider {
				if currentBlockType == "table" {
					continue
				}
			}
			if currentBlockType != "table" {
				closeCurrentBlock()
				currentBlockType = "table"
			}
			currentBlockContent = append(currentBlockContent, line)
			continue
		}

		// 6. Lists
		isTask := taskItemReg.MatchString(line)
		isUl := ulReg.MatchString(line)
		isOl := olReg.MatchString(line)

		if isTask || isUl || isOl {
			if currentBlockType != "list" {
				closeCurrentBlock()
				currentBlockType = "list"
			}
			currentBlockContent = append(currentBlockContent, line)
			continue
		}

		// 7. Paragraph
		if currentBlockType != "paragraph" {
			closeCurrentBlock()
			currentBlockType = "paragraph"
		}
		currentBlockContent = append(currentBlockContent, line)
	}

	closeCurrentBlock()
	return strings.Join(htmlBlocks, "\n")
}
