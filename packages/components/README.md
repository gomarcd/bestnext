# @virtual-ds/components

Lit-based Web Components that implement the Renesas Design System primitives. Components consume the design token CSS variables published by `@virtual-ds/tokens` and expose accessible, framework-agnostic UI building blocks.

## Components

- `<ui-button>` – Button with `variant`, `size`, and `full-width` props.
- `<ui-accordion>` & `<ui-accordion-item>` – Keyboard-accessible accordion supporting single/multi expansion.
- `<ui-card>` – Surface container with variants.
- `<ui-modal>` – Accessible modal dialog with focus trapping and close lifecycle events.
- `<ui-tabs>`, `<ui-tab>`, `<ui-tab-panel>` – Tabbed interface with keyboard navigation.
- `<ui-text-field>` – Labeled text field with helper/error messaging and prefix/suffix slots.

## Usage

```ts
import '@virtual-ds/components/ui-button.js';
import '@virtual-ds/tokens/css';
```

Ensure the token CSS (or runtime theming) is loaded before mounting components so CSS custom properties resolve correctly.

## Scripts

```sh
pnpm --filter @virtual-ds/components build   # type-check + library bundle
pnpm --filter @virtual-ds/components dev     # Vite dev server for examples
pnpm --filter @virtual-ds/components test    # Component unit tests (Vitest)
```
