# E-Dukan Dashboard

Admin dashboard for the E-Dukan store: products (with weight/size variants, stock and photos), categories and subcategories, users and roles, and account settings.

Built with React 19, Vite, TypeScript, Tailwind CSS v4, React Router, TanStack Query and react-i18next (English, Arabic, Spanish, German).

## Getting started

```bash
npm install
cp .env.example .env   # VITE_IS_PROD=true uses the deployed API, otherwise localhost:5000
npm run dev            # http://localhost:3005
```

The backend (`e-commerce-backend`) must allow this origin in `CORS_ORIGIN`.

| Command         | Purpose                         |
| --------------- | ------------------------------- |
| `npm run dev`   | Development server on port 3005 |
| `npm run build` | Type-check and production build |
| `npm run lint`  | Oxlint + ESLint                 |

## Credits

The UI started from the open-source TailAdmin React template (MIT, see `LICENSE.md`).
