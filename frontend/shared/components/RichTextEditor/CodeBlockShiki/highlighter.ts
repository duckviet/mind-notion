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
export async function loadTheme(theme: BundledTheme) {
  if (!highlighter) {
    highlighter = await getShikiHighlighter();
  }

  if (
    highlighter &&
    !highlighter.getLoadedThemes().includes(theme) &&
    !loadingThemes.has(theme)
  ) {
    loadingThemes.add(theme);
    await highlighter.loadTheme(theme);
    loadingThemes.delete(theme);
    return true;
  }

  return false;
}

/**
 * Loads a language if it's valid and not yet loaded
 * @returns true or false depending on if it got loaded.
 */
export async function loadLanguage(language: BundledLanguage) {
  if (!highlighter) {
    highlighter = await getShikiHighlighter();
  }

  if (
    highlighter &&
    !highlighter.getLoadedLanguages().includes(language) &&
    !loadingLanguages.has(language)
  ) {
    loadingLanguages.add(language);
    await highlighter.loadLanguage(language);
    loadingLanguages.delete(language);
    return true;
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

  const themes = [
    ...codeBlocks.map((block) => block.node.attrs.theme as BundledTheme),
    defaultTheme,
  ];
  const languages = [
    ...codeBlocks.map((block) => block.node.attrs.language as BundledLanguage),
    defaultLanguage,
  ];

  if (!highlighter) {
    // Sử dụng highlighter từ shiki-setup.ts
    highlighter = await getShikiHighlighter();
  } else {
    await Promise.all([
      ...themes.flatMap((theme) => loadTheme(theme)),
      ...languages.flatMap((language) => !!language && loadLanguage(language)),
    ]);
  }
}
