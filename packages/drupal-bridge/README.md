# @virtual-ds/drupal-bridge

Drupal bridge package that exposes Twig wrappers, libraries, and token assets for the Renesas Design System. The goal is to simplify adoption by providing drop-in templates that render the Web Components while keeping Twig-driven markup in sync with the design tokens.

## Contents

- `ds_library.info.yml` – Theme definition so Drupal can register and manage the assets.
- `ds_library.libraries.yml` – CSS/JS library pointing to the compiled tokens (`tokens.css`) and component bundle.
- `templates/*.twig` – Twig wrappers for core components (button, accordion, card, modal, text field).
- `token-map.json` – Exported during build so Drupal jobs can ingest design token values.
- `assets/css` & `assets/js` – Copied artifacts from `@virtual-ds/tokens` and `@virtual-ds/components`.

## Build

```sh
pnpm --filter @virtual-ds/tokens build
pnpm --filter @virtual-ds/components build
pnpm --filter @virtual-ds/drupal-bridge build
```

Running the build script copies Twig templates, tokens, and component bundles into `dist/` and creates a `.tar.gz` archive that can be uploaded to Drupal or attached to GitHub Releases.

## Usage

1. Extract `virtual-ds-drupal-bridge.tar.gz` into your Drupal theme directory.
2. Enable the library with `drush theme:enable` or reference it from a custom theme.
3. Include Twig templates such as `@ds/button.twig` from Drupal render arrays to output Web Components with server-rendered fallbacks if desired.
