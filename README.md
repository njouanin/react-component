# solid-react-component

Reusable React components for Solid apps. One package that will grow to include login, profile, and other components—so you depend on a single library instead of many.

**Currently included:**

- **Login** – Solid OIDC login UI and auth guard (customizable, Next.js adapter included).

## Requirements

- React 18+
- [@ldo/solid-react](https://www.npmjs.com/package/@ldo/solid-react) (wrap your app in `BrowserSolidLdoProvider`)

For the **Next.js** login adapter you also need Next.js 13+ (App Router).

## Installation

```bash
npm i solid-react-components @ldo/solid-react react
```

For Next.js (login):

```bash
npm i solid-react-components @ldo/solid-react next react
```

## Login component

### Quick start (Next.js)

1. Wrap your app in `BrowserSolidLdoProvider` (from `@ldo/solid-react`).
2. Wrap the part of the tree that needs auth in `Suspense` and `SolidLoginNavigationProviderNext`, then `AuthGuard`.
3. Render `SolidLoginPage` on your login route.

```tsx
// app/layout.tsx
import { BrowserSolidLdoProvider } from "@ldo/solid-react";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <BrowserSolidLdoProvider>{children}</BrowserSolidLdoProvider>
      </body>
    </html>
  );
}
```

```tsx
// app/page.tsx (home)
"use client";
import { Suspense } from "react";
import { SolidLoginNavigationProviderNext, AuthGuard } from "solid-react-components/login/next";

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SolidLoginNavigationProviderNext config={{ loginPath: "/login", homePath: "/" }}>
        <AuthGuard>
          <YourApp />
        </AuthGuard>
      </SolidLoginNavigationProviderNext>
    </Suspense>
  );
}
```

```tsx
// app/login/page.tsx
"use client";
import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { SolidLoginNavigationProviderNext, AuthGuard, SolidLoginPage } from "solid-react-components/login/next";

export default function Login() {
  const router = useRouter();
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SolidLoginNavigationProviderNext config={{ loginPath: "/login", homePath: "/" }}>
        <AuthGuard>
          <SolidLoginPage
            onAlreadyLoggedIn={() => router.replace("/")}
            title="Sign in"
            subtitle="to continue to My App"
          />
        </AuthGuard>
      </SolidLoginNavigationProviderNext>
    </Suspense>
  );
}
```

### Import paths

- **Next.js (login):** `@solid/react-components/login/next` – provider, guard, and login page wired for Next.
- **Core (login, any React app):** `@solid/react-components/login` – same components; you provide navigation yourself via `SolidLoginNavigationProvider`.
- **Barrel:** `@solid/react-components` – re-exports the login component; use subpaths above for clearer tree-shaking.

### Customizing the login page

- **Props:** `logo`, `logoAlt`, `title`, `subtitle`, `inputPlaceholder`, `inputLabel`, `buttonLabel`, `buttonLoadingLabel`, `defaultIssuer`, `presetIssuers`, `className`.
- **Slots:** `renderLogo`, `renderForm`, `renderFooter`. Use `renderForm` to replace the entire form UI.

### Headless login

```tsx
import { useSolidLogin, LoginFormControl, validateIssuerUrl } from "solid-react-components/login";
```

- `useSolidLogin({ defaultIssuer, presetIssuers, onAlreadyLoggedIn })` – hook with session, issuer state, and `validateAndSubmit`.
- `LoginFormControl` – render-prop component with the same state and handlers.
- `validateIssuerUrl(url)` – returns `{ valid, error }`.

## Package structure

Components are grouped by feature and exposed via subpaths:

| Subpath              | Contents                    |
|----------------------|-----------------------------|
| `solid-react-components`        | Re-exports (e.g. login)     |
| `solid-react-components/login`  | Login: guard, page, hooks   |
| `solid-react-components/login/next` | Login + Next.js adapter |

Future components (e.g. profile, file-picker) will follow the same pattern: `solid-react-components/profile`, `solid-react-components/profile/next`, etc.

## Publishing

- **Package name:** `solid-react-components` (unscoped — you own it, appears on your npm profile).
- **Publishing:** From the package directory: `npm run build` then `npm publish`. Unscoped packages are always public.

## Repository and folder name

- **npm package:** `solid-react-components`
- **Repo URL** (in package.json): `https://github.com/solid/react-components` — change if your repo lives elsewhere.
- **Local folder:** You can keep the folder name as-is (e.g. `solid-login-react`) or rename it to match the package, e.g. `solid-react-components`. The folder name does not affect publishing; only the `name` in package.json does.

## License

MIT
