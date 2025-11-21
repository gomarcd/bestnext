# Storybook

Storybook documents and exercises the Renesas Design System components in isolation. The configuration uses the Web Components + Vite builder, exposes accessibility tooling, and runs automated axe checks via the Storybook test runner.

## Commands

```sh
pnpm install
pnpm --filter @virtual-ds/tokens build   # generate token outputs once
pnpm --filter storybook dev              # launch Storybook locally
pnpm --filter storybook test             # run automated a11y regression checks
```

The preview loads the design token CSS and registers all `@virtual-ds/components` exports so local stories reflect production styling and behaviour.
