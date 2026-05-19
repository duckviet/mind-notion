# Web UI Design Guide

This app is a productivity workspace for notes, editing, search, folders, calendar, and settings. The UI should feel quiet, dense, and task-focused. Avoid marketing-style layouts, oversized decoration, and one-off visual treatments.

## Design Goals

- Keep the first screen useful. Pages should open directly into the workflow, not an explanatory landing view.
- Prioritize scanning, repeated action, and low visual noise.
- Use restrained surfaces, clear hierarchy, and predictable controls.
- Keep editor and note content visually dominant; chrome should support the workflow without competing with it.

## Theme System

Global tokens live in `app/globals.css` and are exposed through Tailwind v4 `@theme inline`.

Use semantic tokens first:

- Backgrounds: `bg-background`, `bg-surface`, `bg-surface-elevated`, `bg-surface-lowered`
- Text: `text-text-primary`, `text-text-secondary`, `text-text-muted`
- Borders: `border-border`, `border-border-subtle`, `border-border-strong`
- Interactive states: `hover:bg-hover`, `hover:bg-hover-overlay`, `active:bg-active-overlay`
- Brand accents: `text-brand-600`, `bg-brand-600`, `border-brand-600`

Avoid hard-coded grays/blues unless the color represents a domain state that is not covered by the semantic tokens. When adding a new reusable color, add it to `globals.css` and expose it through `@theme inline`.

## Color Modes

The app supports:

- Light: default, soft neutral surface.
- Dark: low-contrast dark workspace.
- Black: OLED-oriented black mode.

Any new token must have values for all three modes when it affects surfaces, text, borders, focus, or overlays.

## Layout

- Use full-width page bands or normal constrained layouts. Avoid nesting large cards inside cards.
- Cards are for repeated items, dialogs, and framed tools. Page sections should not become decorative cards by default.
- Keep dense operational screens compact: toolbars, lists, folders, settings rows, and note cards should be easy to scan.
- Prefer stable dimensions for grids, cards, toolbar buttons, editor controls, and skeletons so hover/loading states do not shift layout.

## Components

Shared UI primitives live in `shared/components/ui`. Prefer these over new one-off controls:

- `Button` for commands.
- `Input`, `Textarea`, `Label`, `Select`, `Switch` for forms.
- `Dialog`, `Popover`, `DropdownMenu`, `ContextMenu`, `Tooltip` for overlays.
- `Card` only for actual repeated objects or contained tools.

Use lucide icons for icon buttons and tool actions. Icon-only controls need tooltips unless their meaning is obvious in context.

## Editor UI

The rich text editor implementation lives in `packages/editor`. Web-specific integration stays in `shared/components/RichTextEditor/RichTextEditor.tsx`.

Do not import package internals from web. Use `@mind-notion/editor` public exports or the web wrapper.

Editor UI should keep:

- Minimal borders around content.
- Compact toolbars.
- Clear focus and selection states.
- No global typography overrides that force colors on editor content.

## Typography

- Body text inherits from `--app-font-family`.
- Keep headings proportional to their container. Avoid hero-scale headings inside dashboards, cards, dialogs, and sidebars.
- Do not apply global color rules to `div`, `span`, or `p`; use semantic text classes where needed so local UI can override correctly.
- Avoid negative letter spacing in compact UI.

## Motion

Motion should clarify state changes, not decorate the page.

- Keep transitions short: around `150ms` to `250ms`.
- Avoid animating layout-heavy properties on large lists.
- Respect `prefers-reduced-motion`; `globals.css` already disables most motion under that media query.

## Accessibility

- Preserve visible focus states.
- Ensure icon-only actions have accessible labels or tooltips.
- Keep contrast valid across light, dark, and black modes.
- Do not rely on color alone for destructive, selected, or error states.

## Compatibility Notes

Some older components still use legacy classes such as `glass-bg`, `border-glass-border`, `shadow-glass-lg`, and `-elevated`. These are currently supported in `globals.css` for compatibility, but new code should prefer semantic Tailwind tokens like `bg-surface-elevated`, `border-border-subtle`, and `shadow-md`.

Class strings like `hover: -elevated` are typos and should be fixed in components when touched. Use `hover:bg-surface-elevated` instead.
