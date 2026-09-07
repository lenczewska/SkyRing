# Wayfarer

Starter frontend for a travel app built with React, TypeScript, Vite, and Tailwind CSS.

## Run

```bash
npm install
npm run dev
```

Production build and lint check:

```bash
npm run build
npm run lint
```

## Structure

- `src/App.tsx` - main application screen.
- `src/index.css` - Tailwind and global styles.
- `src/lib/api.ts` - shared client for the future backend API.
- `server/` - reserved location for the backend service.
- `.env.example` - example `VITE_API_URL` variable.

For a local backend, create `.env` from `.env.example`. Until the API is connected, the frontend runs standalone.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
