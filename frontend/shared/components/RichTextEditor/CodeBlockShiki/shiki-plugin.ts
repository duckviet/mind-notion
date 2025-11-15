import { findChildren, type NodeWithPos } from "@tiptap/core";
import type { Node as ProsemirrorNode } from "@tiptap/pm/model";
import { Plugin, PluginKey, type PluginView } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

import {
  getShiki,
  initHighlighter,
  loadLanguage,
  loadTheme,
} from "./highlighter";
import { BundledLanguage, BundledTheme, TokensResult } from "shiki";
export function styleToHtml(styles: Record<string, string>) {
  return Object.entries(styles)
    .map(([key, val]) => `${key}:${val}`)
    .join(";");
}
/** Create code decorations for the current document */
function getDecorations({
  doc,
  name,
  defaultTheme,
  defaultLanguage,
  themes,
}: {
  doc: ProsemirrorNode;
  name: string;
  defaultLanguage: BundledLanguage | null | undefined;
  defaultTheme: BundledTheme;
  themes:
    | {
        light: BundledTheme;
        dark: BundledTheme;
      }
    | null
    | undefined;
}) {
  const decorations: Decoration[] = [];

  const codeBlocks = findChildren(doc, (node) => node.type.name === name);
  for (const block of codeBlocks) {
    let from = block.pos + 1;
    let language = block.node.attrs.language || defaultLanguage;

    const theme = block.node.attrs.theme || defaultTheme;
    const lightTheme = block.node.attrs.themes?.light || themes?.light;
    const darkTheme = block.node.attrs.themes?.dark || themes?.dark;

    // Sử dụng highlighter từ shiki-setup.ts (sync)
    const highlighter = getShiki();

    if (!highlighter) return;

    // Fallback về plaintext nếu language không được support
    if (!highlighter.getLoadedLanguages().includes(language)) {
      language = "plaintext";
    }

    const getThemeToApply = (theme: string): BundledTheme => {
      if (highlighter.getLoadedThemes().includes(theme)) {
        return theme as BundledTheme;
      } else {
        return highlighter.getLoadedThemes()[0] as BundledTheme;
      }
    };

    let tokens: TokensResult;

    if (themes) {
      tokens = highlighter.codeToTokens(block.node.textContent, {
        lang: language,
        themes: {
          light: getThemeToApply(lightTheme),
          dark: getThemeToApply(darkTheme),
        },
      });
      const blockStyle: { [prop: string]: string } = {};
      if (tokens.bg) blockStyle["background-color"] = tokens.bg;
      if (tokens.fg) blockStyle.color = tokens.fg;

      decorations.push(
        Decoration.node(block.pos, block.pos + block.node.nodeSize, {
          style: styleToHtml(blockStyle),
          class: "shiki",
        })
      );
    } else {
      tokens = highlighter.codeToTokens(block.node.textContent, {
        lang: language,
        theme: getThemeToApply(theme),
      });

      const themeToApply = highlighter.getLoadedThemes().includes(theme)
        ? theme
        : highlighter.getLoadedThemes()[0];

      const themeResolved = highlighter.getTheme(themeToApply);

      decorations.push(
        Decoration.node(block.pos, block.pos + block.node.nodeSize, {
          style: styleToHtml({ "background-color": themeResolved.bg }),
        })
      );
    }

    for (const line of tokens.tokens) {
      for (const token of line) {
        const to = from + token.content.length;

        //NOTE: tokens object will be different if themes supplied
        // thus, need to handle style accordingly
        let style = "";

        if (themes) {
          style = styleToHtml(token.htmlStyle || {});
        } else {
          style = styleToHtml({ color: token.color || "inherit" });
        }

        const decoration = Decoration.inline(from, to, {
          style: style,
        });

        decorations.push(decoration);

        from = to;
      }

      from += 1;
    }
  }

  return DecorationSet.create(doc, decorations);
}

export function ShikiPlugin({
  name,
  defaultLanguage,
  defaultTheme,
  themes,
}: {
  name: string;
  defaultLanguage: BundledLanguage | null | undefined;
  defaultTheme: BundledTheme;
  themes:
    | {
        light: BundledTheme;
        dark: BundledTheme;
      }
    | null
    | undefined;
}) {
  const shikiPlugin: Plugin<DecorationSet | undefined> = new Plugin({
    key: new PluginKey("shiki"),

    view(view) {
      // This small view is just for initial async handling
      class ShikiPluginView implements PluginView {
        constructor() {
          this.initDecorations();
        }

        update() {
          this.checkUndecoratedBlocks();
        }

        destroy() {}

        // Initialize shiki async, and then highlight initial document
        async initDecorations() {
          const doc = view.state.doc;
          await initHighlighter({
            doc,
            name,
            defaultLanguage,
            defaultTheme,
            themeModes: themes,
          });

          // Use setTimeout to ensure view state is stable after async operation
          // This prevents "mismatched transaction" errors
          setTimeout(() => {
            if (!view.dom.isConnected) return; // View has been destroyed

            try {
              const currentState = view.state;
              const tr = currentState.tr.setMeta(
                "shikiPluginForceDecoration",
                true
              );
              view.dispatch(tr);
            } catch (error) {
              // Silently ignore if view state doesn't match
              console.warn(
                "Shiki plugin: Failed to dispatch decoration transaction",
                error
              );
            }
          }, 0);
        }

        // When new codeblocks were added and they have missing themes or
        // languages, load those and then add code decorations once again.
        async checkUndecoratedBlocks() {
          const codeBlocks = findChildren(
            view.state.doc,
            (node) => node.type.name === name
          );

          const loaderFns = (block: NodeWithPos): Promise<boolean>[] => {
            const fns: Promise<boolean>[] = [];

            // Only load language if it exists and is valid
            const language = block.node.attrs.language;
            if (language) {
              fns.push(loadLanguage(language));
            }

            if (themes) {
              // Only load themes if they exist and are valid
              const lightTheme = block.node.attrs.themes?.light || themes.light;
              const darkTheme = block.node.attrs.themes?.dark || themes.dark;
              if (lightTheme) {
                fns.push(loadTheme(lightTheme));
              }
              if (darkTheme) {
                fns.push(loadTheme(darkTheme));
              }
            } else {
              // Only load theme if it exists and is valid
              const theme = block.node.attrs.theme;
              if (theme) {
                fns.push(loadTheme(theme));
              }
            }

            return fns;
          };

          // Load missing themes or languages when necessary.
          // loadStates is an array with booleans depending on if a theme/lang
          // got loaded.
          const loadStates = await Promise.all(
            codeBlocks.flatMap((block) => loaderFns(block))
          );
          const didLoadSomething = loadStates.includes(true);

          // The asynchronous nature of this is potentially prone to
          // race conditions. Use setTimeout to ensure view state is stable after async operation

          if (didLoadSomething) {
            // Use setTimeout to ensure view state is stable after async operation
            // This prevents "mismatched transaction" errors
            setTimeout(() => {
              if (!view.dom.isConnected) return; // View has been destroyed

              try {
                const currentState = view.state;
                const tr = currentState.tr.setMeta(
                  "shikiPluginForceDecoration",
                  true
                );
                view.dispatch(tr);
              } catch (error) {
                // Silently ignore if view state doesn't match
                console.warn(
                  "Shiki plugin: Failed to dispatch decoration transaction",
                  error
                );
              }
            }, 0);
          }
        }
      }

      return new ShikiPluginView();
    },

    state: {
      init: (_, { doc }) => {
        return getDecorations({
          doc,
          name,
          defaultLanguage,
          defaultTheme,
          themes: themes,
        });
      },
      apply: (transaction, decorationSet, oldState, newState) => {
        const oldNodeName = oldState.selection.$head.parent.type.name;
        const newNodeName = newState.selection.$head.parent.type.name;
        const oldNodes = findChildren(
          oldState.doc,
          (node) => node.type.name === name
        );
        const newNodes = findChildren(
          newState.doc,
          (node) => node.type.name === name
        );

        const didChangeSomeCodeBlock =
          transaction.docChanged &&
          // Apply decorations if:
          // selection includes named node,
          ([oldNodeName, newNodeName].includes(name) ||
            // OR transaction adds/removes named node,
            newNodes.length !== oldNodes.length ||
            // OR transaction has changes that completely encapsulte a node
            // (for example, a transaction that affects the entire document).
            // Such transactions can happen during collab syncing via y-prosemirror, for example.
            transaction.steps.some((step) => {
              return (
                // @ts-expect-error
                step.from !== undefined &&
                // @ts-expect-error
                step.to !== undefined &&
                oldNodes.some((node) => {
                  return (
                    // @ts-expect-error
                    node.pos >= step.from &&
                    // @ts-expect-error
                    node.pos + node.node.nodeSize <= step.to
                  );
                })
              );
            }));

        // only create code decoration when it's necessary to do so
        if (
          transaction.getMeta("shikiPluginForceDecoration") ||
          didChangeSomeCodeBlock
        ) {
          return getDecorations({
            doc: transaction.doc,
            name,
            defaultLanguage,
            defaultTheme,
            themes,
          });
        }

        return (
          decorationSet?.map(transaction.mapping, transaction.doc) ||
          DecorationSet.empty
        );
      },
    },

    props: {
      decorations(state) {
        return shikiPlugin.getState(state);
      },
    },
  });

  return shikiPlugin;
}
