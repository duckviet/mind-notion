package utils

import (
	"fmt"
	"regexp"
	"strings"
	"unicode/utf8"

	"github.com/duckviet/gin-collaborative-editor/backend/internal/database/models"
)

// DefaultNotePreviewLength limits how many characters of content are returned in list responses.
const DefaultNotePreviewLength = 500

// FormatNotePreviews trims content on a list of notes so list responses stay lightweight.
func FormatNotePreviews(notes []*models.Note, maxLength int) {
	if maxLength <= 0 {
		maxLength = DefaultNotePreviewLength
	}

	for _, note := range notes {
		if note == nil {
			continue
		}
		note.Content = FormatNotePreview(note.Content, maxLength)
	}
}

// FormatNotePreview normalizes whitespace and truncates content to a preview length.
func FormatNotePreview(content string, maxLength int) string {
	if maxLength <= 0 {
		maxLength = DefaultNotePreviewLength
	}

	var sliceContent string
	isTruncated := false

	if utf8.RuneCountInString(content) <= maxLength {
		sliceContent = content
	} else {
		// Cắt theo rune để tránh lỗi font tiếng Việt
		runes := []rune(content)
		sliceContent = string(runes[:maxLength])
		isTruncated = true
	}

	// 1. Normalize (Giả định hàm normalizeNoteContent của bạn thực hiện dọn dẹp whitespace)
	// cleaned := normalizeNoteContent(sliceContent) 
	cleaned := sliceContent // Thay bằng hàm của bạn

	if cleaned == "" {
		return ""
	}

	// 2. Fix HTML: Đóng các tag bị cắt dở
	// Việc split rồi đóng từng cái hay đóng cả cụm phụ thuộc vào mục đích của bạn.
	// Thông thường, để làm preview, ta đóng toàn bộ chuỗi đã cắt.
	finalHTML := closeMissingTags(cleaned)

	if isTruncated {
		return finalHTML + "..."
	}
	return finalHTML
}
// SUPPORT_HTML_TAG = []string{"div", "pre", "p", "br", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "strong", "em", "b", "i", "u", "a"}

func closeMissingTags(htmlChunk string) string {
	// Regex để tìm tất cả các thẻ mở và đóng
	// Bỏ qua các thẻ tự đóng như <br/>, <img>
	re := regexp.MustCompile(`<(/?)([a-zA-Z0-9]+)[^>]*>`)
	matches := re.FindAllStringSubmatch(htmlChunk, -1)

	var stack []string
	for _, match := range matches {
		isClosing := match[1] == "/"
		tagName := strings.ToLower(match[2])

		if isClosing {
			// Nếu gặp thẻ đóng, xóa tag tương ứng khỏi stack (nếu có)
			if len(stack) > 0 && stack[len(stack)-1] == tagName {
				stack = stack[:len(stack)-1]
			}
		} else {
			// Nếu là thẻ mở, đưa vào stack
			// Bỏ qua các tag không cần đóng (void elements)
			voidElements := map[string]bool{"br": true, "img": true, "hr": true, "input": true}
			if !voidElements[tagName] {
				stack = append(stack, tagName)
			}
		}
	}

	// Tạo chuỗi các thẻ đóng cho các thẻ còn dư trong stack (theo thứ tự ngược lại)
	var closingTags strings.Builder
	for i := len(stack) - 1; i >= 0; i-- {
		closingTags.WriteString(fmt.Sprintf("</%s>", stack[i]))
	}

	return htmlChunk + closingTags.String()
}

func reFormatSliceContent(content string) []string {
	// Giữ logic split cũ của bạn
	re := regexp.MustCompile(`</[a-zA-Z0-9]+>`)
	indices := re.FindAllStringIndex(content, -1)
	
	var rawSlices []string
	lastPos := 0
	for _, loc := range indices {
		rawSlices = append(rawSlices, content[lastPos:loc[1]])
		lastPos = loc[1]
	}
	if lastPos < len(content) {
		rawSlices = append(rawSlices, content[lastPos:])
	}

	var finalSlices []string
	for _, slice := range rawSlices {
		// Fix lỗi thiếu tag cho từng slice
		fixed := closeMissingTags(slice)
		finalSlices = append(finalSlices, fixed)
	}

	return finalSlices
}
func normalizeNoteContent(content string) string {
	if content == "" {
		return ""
	}

	normalized := strings.NewReplacer("\r\n", "\n", "\r", "\n").Replace(content)
	normalized = strings.ReplaceAll(normalized, "\n", " ")
	normalized = strings.TrimSpace(normalized)
	normalized = strings.Join(strings.Fields(normalized), " ")
	return normalized
}

// [6.204ms] [rows:7] SELECT * FROM "notes" WHERE user_id = 'b54fbf9b-b0ff-4d2c-907e-17c8245efed9' AND top_of_mind = false AND "notes"."deleted_at" IS NULL LIMIT 50
// <pre data-language="ts" class="p-4 rounded-lg bg-gray-50 font-mono border border-gray-200 text-sm overflow-x-auto"><code spellcheck="false">// MasonryGrid.tsx import React, { Fragment, useEffect, useR
// //  [<pre data-language="ts" class="p-4 rounded-lg bg-gray-50 font-mono border border-gray-200 text-sm overflow-x-auto"><code spellcheck="false">// MasonryGrid.tsx import React, { Fragment, useEffect, useR]<p>Test 2</p><h2 class="text-3xl font-semibold my-3">2fs</h2><p>&nbsp; &nbsp;343</p><p>423</p><p></p>
// //  [<p>Test 2 <h2 class="text-3xl font-semibold my-3">2fs <p>&nbsp; &nbsp;343 <p>423 <p> ]<p>faewf</p><p><strong>dsfh</strong><br></p>
// //  [<p>faewf <p><strong>dsfh <br> ]<pre data-language="typescript" class="p-4 rounded-lg bg-gray-50 font-mono border border-gray-200 text-sm overflow-x-auto"><code spellcheck="false">import { findChildren, type NodeWithPos } from "@tip
// //  [<pre data-language="typescript" class="p-4 rounded-lg bg-gray-50 font-mono border border-gray-200 text-sm overflow-x-auto"><code spellcheck="false">import { findChildren, type NodeWithPos } from "@tip]<h1 class="text-4xl font-bold my-4">asfsa</h1><p></p><p></p>
// //  [<h1 class="text-4xl font-bold my-4">asfsa <p> <p> ]<h2 class="text-3xl font-semibold my-3"><strong>Anime.js v3.1.0</strong></h2><p>Đây là mã nguồn của <strong>Anime.js v3.1.0</strong>, một thư viện JavaScript nổi tiếng được phát
// //  [<h2 class="text-3xl font-semibold my-3"><strong>Anime.js v3.1.0  <p>Đây là mã nguồn của <strong>Anime.js v3.1.0 , một thư viện JavaScript nổi tiếng được phát]<pre data-language="typescript" class="p-4 rounded-lg bg-gray-50 font-mono border border-gray-200 text-sm overflow-x-auto"><code spellcheck="false">import React, { useState, useRef, useEffect } from "
// //  [<pre data-language="typescript" class="p-4 rounded-lg bg-gray-50 font-mono border border-gray-200 text-sm overflow-x-auto"><code spellcheck="false">import React, { useState, useRef, useEffect } from "]::1 - [27/Dec/2025:16:38:03 +0700] "GET /api/v1/notes/list?limit=50&offset=0&query= HTTP/1.1 200 26.770283ms "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0" "
// [GIN] 2025/12/27 - 16:38:03 | 200 |   26.826765ms |             ::1 | GET      "/api/v1/notes/list?limit=50&offset=0&query="