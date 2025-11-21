# @virtual-ds/tokens

Design tokens for the Renesas Design System powered by Style Dictionary. The package exports CSS custom properties, SCSS variables, JSON, and TypeScript helpers for both light and dark themes.

## Build

```sh
pnpm install
pnpm --filter @virtual-ds/tokens build
```

Outputs are written to `dist/`:

- `dist/css/tokens.css` – CSS variables (includes light and dark selectors).
- `dist/scss/_tokens.light.scss`, `_tokens.dark.scss` – Theme-specific SCSS variables.
- `dist/scss/_index.scss` – Forwarding entry point with prefixed exports.
- `dist/json/tokens.{theme}.json` and `dist/json/tokens.json` – Nested JSON structures.
- `dist/index.js` / `dist/index.d.ts` – Runtime + types.
- `dist/ts/index.ts` – Literal TypeScript source for consumers who prefer direct imports.

Use `getToken(theme, path)` to read a token by dot-delimited path at runtime.
