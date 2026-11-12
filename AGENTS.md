# AGENTS.md — E-Dukan Dashboard

Admin dashboard for the E-Dukan store (single shop). React 19 · Vite 8 · TypeScript ~6 · Tailwind CSS v4 · React Router 8 · TanStack Query v5 · Base UI · react-i18next · React Hook Form + Zod. Talks to the REST API in `../e-commerce-backend` (see that folder's `AGENTS.md`).

Read **`DESIGN.md`** before any UI work. It defines the macOS-inspired design system (tokens, components, page recipes, do/don't).

## Commands

| Command            | Purpose                                         |
| ------------------ | ----------------------------------------------- |
| `npm run dev`      | Vite dev server on **http://localhost:3005**    |
| `npm run build`    | `tsc -b` + Vite production build                |
| `npm run lint`     | Oxlint + ESLint (`lint:fast` = Oxlint only)     |
| `npm run format`   | Prettier                                        |

There is no frontend test suite. **Run `npm run build` and `npm run lint` after every change.** Lint must not add new warnings in files you touch.

Environment (`.env`, git-ignored; see `.env.example`): `VITE_API_BASE_URL` (default `http://localhost:5000/api/v1`), `VITE_GOOGLE_CLIENT_ID` (Google button hidden when empty). Vite reloads `.env` automatically.

## Where things live

```text
src/
├── App.tsx                 # THE route registry (static imports)
├── main.tsx                # BrowserRouter → ThemeProvider → Helmet → I18n → AuthProvider → Tooltip → App
├── index.css               # Tailwind v4 config + design tokens + utilities (see DESIGN.md)
├── api/                    # Backend calls — one file per resource
│   ├── client.ts           # fetch wrapper: envelope unwrapping, ApiError, token refresh, FormData
│   ├── query-client.ts     # TanStack Query client + queryKeys
│   ├── auth.ts users.ts profile.ts categories.ts products.ts
│   └── types.ts            # AuthUser, AuthSession, ApiEnvelope
├── contexts/               # AuthProvider/useAuth, ThemeProvider/useTheme
├── components/
│   ├── layout/app-layout/  # Shell: floating glass sidebar (sidebar/data.tsx = nav), header, Outlet
│   ├── shared/             # route-guards, page-meta, page-breadcrumb, table-pagination, access-denied, header widgets
│   └── ui/                 # Base UI primitives (button, input, select, dialog, badge, alert…), no barrel
├── pages/
│   ├── main/               # Signed-in pages: dashboard/ecommerce, products, catalog, users, profile, pages/error-404
│   └── others/auth/        # Sign-in, sign-up, forgot/reset password, verify email, Google button
├── hooks/                  # use-debounced-value, use-mobile
├── i18n/ + messages/{en,ar,es,de}.json
├── icons/                  # SVG components; import from "@/icons"
└── utils/                  # cn, roles (ROLE_NAMES, hasAnyRole), form-errors, password-schema, get-initials
```

Path alias: `@/*` → `src/*`. Import router APIs from `react-router` (never `react-router-dom`).

## Routes and access

`src/App.tsx` is the only source of routes.

| Path | Page | Access |
| --- | --- | --- |
| `/` | Store overview: KPIs, 30-day sales, best sellers, low stock, recent orders (`/admin/orders/stats`) | signed in (data for `STAFF_ROLES`) |
| `/orders`, `/orders/:id` | Order list (stats, status tabs) and detail (status workflow, payment, timeline) | `STAFF_ROLES` (SUPER_ADMIN, ADMIN, MANAGER) |
| `/products`, `/products/new`, `/products/:id/edit` | Product list and editor | `STAFF_ROLES` |
| `/categories`, `/subcategories` | Catalog | `STAFF_ROLES` |
| `/users` | User and role management | `ADMIN_ROLES` (SUPER_ADMIN, ADMIN) |
| `/profile` | Own account | signed in |
| `/signin`, `/signup`, `/forgot-password` | Auth | signed out only (`GuestRoute`) |
| `/auth/reset-password`, `/auth/verify-email` | Email links from the backend | anyone |

Guards live in `components/shared/route-guards.tsx`: `ProtectedRoute` (signed in), `RoleRoute roles={…}` (shows `AccessDenied`), `GuestRoute`. Sidebar items take a `roles` array, so hide what a role can't open. **The backend enforces roles too; UI guards are convenience only.**

### Adding a page

1. Create a kebab-case folder under `pages/main/<feature>/`; default-export the page from `index.tsx`. Colocate `schema.ts`, hooks and sub-components.
2. Start with `<PageMeta>` + `<PageBreadcrumb>`; follow a recipe in `DESIGN.md` §4.
3. Register the route in `App.tsx` inside the right guard.
4. Add a sidebar entry in `components/layout/app-layout/sidebar/data.tsx` (with `roles` if restricted) **and** `sidebar.items.<key>` in all four message files. Active matching is exact, plus a prefix match for `/products/*`.

## Data and API

- Add calls to the matching `src/api/<resource>.ts` using `apiRequest<T>(path, { method, body, signal })`. It returns `data` from the `{ success, message, data, errors }` envelope and throws `ApiError` (`status`, `fieldErrors`, `isNetworkError`).
- `auth: false` only for public auth endpoints. Everything else sends the access token and transparently refreshes once on 401.
- Uploads: pass a `FormData` body (see `productsApi.uploadImages`).
- Show errors with `getApiErrorMessage(error, { network, unexpected })` and map backend field errors onto forms with `applyFieldErrors(error, setError, fieldMap)` (`@/utils/form-errors`).

### Server state: TanStack Query v5

All server data goes through **TanStack Query**. Don't fetch in `useEffect` or keep API data in `useState`.

- The client and every query key live in `src/api/query-client.ts` (`queryClient`, `queryKeys`). Add new keys there; never inline key arrays in components.
- Wrap each query in a feature hook next to the page (`use-products.ts`, `use-users.ts`, `catalog/shared/use-categories.ts`):

  ```ts
  useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: ({ signal }) => productsApi.list(params, signal), // pass signal for cancellation
    placeholderData: keepPreviousData, // lists: keep the old page visible while the next loads
  });
  ```

- After a mutation, **invalidate the resource** (`queryClient.invalidateQueries({ queryKey: queryKeys.products.all })`) or write the returned entity with `setQueryData`. Use the existing helpers (`useProductCache`, `useInvalidateCatalog`, `useInvalidateUsers`). Category changes also invalidate products (they show category names), and product changes invalidate categories (product counts).
- Defaults (`staleTime` 30s, refetch on focus, no retry on 4xx) are set once in `query-client.ts`.
- The cache is cleared on sign-out (`AuthProvider`), so a new account never sees the previous account's data.
- Auth/session state is **not** in Query; it stays in `AuthProvider` (see below).
- React Query Devtools appear in dev only (bottom-left button).

### Auth rules (do not break)

- The access token lives **in memory only** (`api/client.ts`). The refresh token is an httpOnly cookie, so never store tokens in `localStorage`.
- Refreshes must never run in parallel: the backend rotates refresh tokens and treats reuse as theft (revokes every session). Always go through `refreshSession()`; it de-duplicates in-tab and across tabs (Web Locks).
- After changing the signed-in user (profile, avatar), call `updateUser(user)` from `useAuth()`.
- Roles: `@/utils/roles`. Use `hasAnyRole(user.roles, ADMIN_ROLES)`, not string comparisons scattered in components.

## Forms

React Hook Form + `zodResolver` + a colocated `schema.ts` exporting `createXSchema(t)` (messages are translated, so schemas are built with `t`). Use `Field` / `FieldLabel` / `FieldError` from `@/components/ui/field`. Numeric inputs are kept as strings in the form and converted in a `toXInput()` mapper (see `products/editor/schema.ts`). Password rules must match the backend: `@/utils/password-schema`.

## Components and state

- Files and folders lower-kebab-case; components PascalCase. Pages default-export; primitives and utilities named-export.
- Import primitives directly: `import { Button } from "@/components/ui/button";`. Extend with `cva` variants, `data-slot`, and `cn()`.
- Dialogs: controlled `open` / `onOpenChange`; render the form *inside* `DialogContent` so it remounts (fresh state) on each open.
- `Select` from Base UI: pass `items` so the trigger shows labels, not values.
- Theme: `useTheme()` (`light` | `dark` | `auto`, default `auto` = follow the OS).

## i18n

- Locales `en` (fallback), `ar` (RTL), `es`, `de`. **Every user-facing string goes into all four `src/messages/*.json` files**, with the same keys. ICU syntax for interpolation and plurals (`{count, plural, one {…} other {…}}`).
- `const t = useTranslations("namespace")` from `@/i18n`; `getTranslations` outside components.
- Page titles end with ` | E-Dukan`.

## Styling

See `DESIGN.md`. In short:

- Tailwind v4 config lives only in `src/index.css`. No `tailwind.config.*`, CSS Modules or CSS-in-JS.
- New code uses **semantic tokens** (`bg-canvas`, `bg-surface`, `text-label`, `text-label-secondary`, `border-separator`, `bg-fill`, `accent`) and the utilities `surface-card`, `material`, `material-thick`. These switch with dark mode automatically.
- Existing code uses `gray-*` / `brand-*` with `dark:` pairs; that is fine to keep, but don't add new `bg-white dark:bg-gray-900`-style pairs.
- RTL: logical utilities only (`ms/me`, `ps/pe`, `inset-s/e`, `border-s/e`, `text-start/end`); flip directional icons with `rtl:rotate-180`.
- New `@utility` classes need a matching tailwind-merge group in `src/utils/cn.ts`.

## Icons and assets

- Shared icons: kebab-case `.tsx` taking `IconProps`, exported from `src/icons/index.tsx`. Don't inline SVG in pages.
- Brand assets: `public/images/logo/{logo,logo-dark,logo-icon,auth-logo}.svg`, `public/favicon.svg`.

## Boundaries

- Ask before installing packages.
- Keep `App.tsx` and `sidebar/data.tsx` as the only routing and navigation sources.
- Promote code to `components/shared` or `components/ui` only when it is reused across routes.
- Don't commit `.env`. Don't remove `LICENSE.md` (MIT attribution for the original template).
