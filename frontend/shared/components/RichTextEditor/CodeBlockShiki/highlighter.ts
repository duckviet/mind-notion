import { findChildren } from "@tiptap/core";
import type { Node as ProsemirrorNode } from "@tiptap/pm/model";
import {
  type BundledLanguage,
  type BundledTheme,
  createHighlighter,
  type Highlighter,
} from "shiki";
import { getShikiHighlighter } from "@/shiki-setup";

let highlighter: Highlighter | undefined;
let highlighterPromise: Promise<void> | undefined;
const loadingLanguages = new Set<BundledLanguage>();
const loadingThemes = new Set<BundledTheme>();

type HighlighterOptions = {
  themes: (BundledTheme | null | undefined)[];
  languages: (BundledLanguage | null | undefined)[];
};

export function resetHighlighter() {
  highlighter = undefined;
  highlighterPromise = undefined;
  loadingLanguages.clear();
  loadingThemes.clear();
}

export function getShiki() {
  return highlighter;
}

// Sử dụng highlighter từ shiki-setup.ts
export async function getShikiFromSetup() {
  return await getShikiHighlighter();
}

/**
 * Load the highlighter. Makes sure the highlighter is only loaded once.
 */
export async function loadHighlighter(opts: HighlighterOptions) {
  if (!highlighter && !highlighterPromise) {
    // Sử dụng highlighter từ shiki-setup.ts
    highlighter = await getShikiHighlighter();
    return highlighter;
  }

  if (highlighterPromise) {
    return highlighterPromise;
  }

  return highlighter;
}

/**
 * Loads a theme if it's valid and not yet loaded.
 * @returns true or false depending on if it got loaded.
 */
export async function loadTheme(theme: BundledTheme | null | undefined) {
  // Validate theme before proceeding
  if (!theme) {
    return false;
  }

  if (!highlighter) {
    highlighter = await getShikiHighlighter();
  }

  if (
    highlighter &&
    !highlighter.getLoadedThemes().includes(theme) &&
    !loadingThemes.has(theme)
  ) {
    loadingThemes.add(theme);
    try {
      await highlighter.loadTheme(theme);
      loadingThemes.delete(theme);
      return true;
    } catch (error) {
      loadingThemes.delete(theme);
      console.warn(`Failed to load theme: ${theme}`, error);
      return false;
    }
  }

  return false;
}

/**
 * Loads a language if it's valid and not yet loaded
 * @returns true or false depending on if it got loaded.
 */
export async function loadLanguage(
  language: BundledLanguage | null | undefined
) {
  // Validate language before proceeding
  if (!language) {
    return false;
  }

  if (!highlighter) {
    highlighter = await getShikiHighlighter();
  }

  if (
    highlighter &&
    !highlighter.getLoadedLanguages().includes(language) &&
    !loadingLanguages.has(language)
  ) {
    loadingLanguages.add(language);
    try {
      await highlighter.loadLanguage(language);
      loadingLanguages.delete(language);
      return true;
    } catch (error) {
      loadingLanguages.delete(language);
      console.warn(`Failed to load language: ${language}`, error);
      return false;
    }
  }

  return false;
}

/**
 * Initializes the highlighter based on the prosemirror document,
 * with the themes and languages in the document.
 */
export async function initHighlighter({
  doc,
  name,
  defaultTheme,
  defaultLanguage,
  themeModes,
}: {
  doc: ProsemirrorNode;
  name: string;
  defaultLanguage: BundledLanguage | null | undefined;
  defaultTheme: BundledTheme;
  themeModes:
    | {
        light: BundledTheme;
        dark: BundledTheme;
      }
    | null
    | undefined;
}) {
  const codeBlocks = findChildren(doc, (node) => node.type.name === name);

  // Collect themes and languages, filtering out null/undefined values
  const themes: (BundledTheme | null | undefined)[] = [
    ...codeBlocks.map(
      (block) => block.node.attrs.theme as BundledTheme | undefined
    ),
    defaultTheme,
  ].filter((theme): theme is BundledTheme => !!theme);

  const languages: (BundledLanguage | null | undefined)[] = [
    ...codeBlocks.map(
      (block) => block.node.attrs.language as BundledLanguage | undefined
    ),
    defaultLanguage,
  ].filter((language): language is BundledLanguage => !!language);

  if (!highlighter) {
    // Sử dụng highlighter từ shiki-setup.ts
    highlighter = await getShikiHighlighter();
  } else {
    await Promise.all([
      ...themes.map((theme) => loadTheme(theme)),
      ...languages.map((language) => loadLanguage(language)),
    ]);
  }
}
