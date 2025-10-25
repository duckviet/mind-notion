// shiki-setup.ts
import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

// Định nghĩa languages và themes cần dùng
const bundledLanguages = {
  javascript: () => import("@shikijs/langs/javascript"),
  typescript: () => import("@shikijs/langs/typescript"),
  python: () => import("@shikijs/langs/python"),
  css: () => import("@shikijs/langs/css"),
  html: () => import("@shikijs/langs/html"),
  json: () => import("@shikijs/langs/json"),
  bash: () => import("@shikijs/langs/bash"),
  markdown: () => import("@shikijs/langs/markdown"),
};

const bundledThemes = {
  dark: () => import("@shikijs/themes/github-dark"),
  light: () => import("@shikijs/themes/github-light"),
};

// Singleton highlighter instance
let highlighterPromise: Promise<any> | null = null;

export async function getShikiHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      langs: Object.values(bundledLanguages),
      themes: Object.values(bundledThemes),
      engine: createJavaScriptRegexEngine(),
    });
  }
  return highlighterPromise;
}

// Function để highlight code (sử dụng trong NodeView)
export async function highlightCode(
  code: string,
  lang: Lang,
  theme: Theme = "dark"
): Promise<string> {
  const highlighter = await getShikiHighlighter();
  return highlighter.codeToHtml(code, {
    lang,
    theme,
  });
}

// Dispose khi không cần (gọi ở app shutdown nếu cần)
export async function disposeHighlighter() {
  const highlighter = await getShikiHighlighter();
  highlighter.dispose();
  highlighterPromise = null;
}

// Theme mapping
export const themeMap: Record<string, string> = {
  dark: "github-dark",
  light: "github-light",
};

// Language aliases
export const langMap: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  css: "css",
  html: "html",
  json: "json",
  sh: "bash",
  md: "markdown",
};
export type Lang = keyof typeof langMap;
export type Theme = keyof typeof themeMap;
