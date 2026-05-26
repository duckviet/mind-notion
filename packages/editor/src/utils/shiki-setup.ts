import { createHighlighter, type BundledLanguage, type BundledTheme } from "shiki";

const languages = [
  "javascript",
  "typescript",
  "tsx",
  "jsx",
  "python",
  "css",
  "html",
  "json",
  "bash",
  "markdown",
] satisfies BundledLanguage[];

const themes = ["github-dark", "github-light"] satisfies BundledTheme[];

// Singleton highlighter instance
let highlighterPromise: ReturnType<typeof createHighlighter> | null = null;

export async function getShikiHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      langs: languages,
      themes,
    });
  }
  return highlighterPromise;
}

export async function highlightCode(
  code: string,
  lang: Lang,
  theme: Theme = "dark",
): Promise<string> {
  const highlighter = await getShikiHighlighter();
  return highlighter.codeToHtml(code, {
    lang,
    theme,
  });
}

export async function disposeHighlighter() {
  const highlighter = await getShikiHighlighter();
  highlighter.dispose();
  highlighterPromise = null;
}

export const themeMap: Record<string, string> = {
  dark: "github-dark",
  light: "github-light",
};

export const langMap: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  jsx: "jsx",
  tsx: "tsx",
  py: "python",
  css: "css",
  html: "html",
  json: "json",
  sh: "bash",
  md: "markdown",
};
export type Lang = keyof typeof langMap;
export type Theme = keyof typeof themeMap;
