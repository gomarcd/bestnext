# Documentation app

Next.js 14 app router site that powers the Renesas Design System documentation. Content is authored in MDX and processed via Contentlayer, enabling rich component pages with code samples, accessibility guidance, and integrated search.

## Commands

```sh
pnpm --filter docs dev      # local development
pnpm --filter docs build    # production build
pnpm --filter docs lint
```

## Environment variables

- `NEXT_PUBLIC_GA_ID` – optional Google Analytics 4 measurement ID.
- `NEXT_PUBLIC_STORYBOOK_URL` – optional URL to the deployed Storybook instance for embedded playgrounds.

## API routes

- `GET /api/search?q=` – Lunr-backed document search.
- `GET /api/components` – Component catalog, supports `status`, `tag`, `page`, `pageSize`, `q` filters.
- `GET /api/components/:id` – Component detail payload.
- `GET /api/tokens` – Flattened design token inventory.
