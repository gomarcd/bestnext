# Renesas Design System

Monorepo housing the Renesas Design System platform including documentation site, component library, design tokens, Drupal bridge, and supporting tooling.

## Packages

- `packages/tokens` – Design token pipeline powered by Style Dictionary.
- `packages/components` – Lit-based Web Components.
- `packages/drupal-bridge` – Drupal integration (theme + module assets).

## Applications

- `apps/docs` – Next.js documentation site (MDX/Contentlayer).
- `apps/api` – API surfaces for components and tokens.

## Tooling

- `tooling/storybook` – Storybook configuration for component playground and accessibility checks.

## Getting Started

```sh
pnpm install
pnpm dev
```

Individual packages and apps expose additional scripts documented within their directories.
