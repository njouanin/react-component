# solid-react-component

Reusable React components for [Solid](https://solidproject.org/) apps. One package for login, auth guard, and more—so you depend on a single library instead of many.

**Currently included:**

- **Login** – Solid OIDC login UI and auth guard (customizable, with an optional Next.js adapter).

## Requirements

- **React** 18+
- **[@ldo/solid-react](https://www.npmjs.com/package/@ldo/solid-react)** – wrap your app in `BrowserSolidLdoProvider`

For the **Next.js** login adapter you also need **Next.js 13+** (App Router).

## Installation

```bash
npm i solid-react-component @ldo/solid-react react
```

With Next.js (for the login adapter):

```bash
npm i solid-react-component @ldo/solid-react next react
```

## Login

### Quick start (Next.js)

1. Wrap your app in `BrowserSolidLdoProvider` (from `@ldo/solid-react`).
2. Wrap the tree that needs auth in `Suspense` and `SolidLoginNavigationProviderNext`, then `AuthGuard`.
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
import { SolidLoginNavigationProviderNext, AuthGuard } from "solid-react-component/login/next";

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
import { SolidLoginNavigationProviderNext, AuthGuard, SolidLoginPage } from "solid-react-component/login/next";

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

| Import | Use case |
|--------|----------|
| `solid-react-component/login/next` | Next.js: provider, guard, and login page wired to Next Router. |
| `solid-react-component/login` | Any React app: same components; you provide navigation via `SolidLoginNavigationProvider`. |
| `solid-react-component` | Barrel re-export of login; use the subpaths above for better tree-shaking. |

### Customizing the login page

- **Props:** `logo`, `logoAlt`, `title`, `subtitle`, `inputPlaceholder`, `inputLabel`, `buttonLabel`, `buttonLoadingLabel`, `defaultIssuer`, `presetIssuers`, `className`, `footerGitHubUrl`, `footerIssuesUrl`.
- **Slots:** `renderLogo`, `renderForm`, `renderFooter`. Use `renderForm` to replace the entire form UI.

### Headless login

```tsx
import { useSolidLogin, LoginFormControl, validateIssuerUrl } from "solid-react-component/login";
```

- **`useSolidLogin({ defaultIssuer, presetIssuers })`** – hook returning `session`, issuer state, and `validateAndSubmit`.
- **`LoginFormControl`** – render-prop component that exposes the same state and handlers.
- **`validateIssuerUrl(url)`** – returns `{ valid, error }`.

### Other React apps (no Next.js)

Implement the `SolidLoginNavigation` interface (pathname, search params, replace, redirect) and provide it via `SolidLoginNavigationProvider`. See `src/login/navigation.ts` for the type and `src/login/next.tsx` for a Next.js implementation example.

## Package structure

Components are grouped by feature and exposed as subpaths:

| Subpath | Contents |
|---------|----------|
| `solid-react-component` | Re-exports (e.g. login) |
| `solid-react-component/login` | Login: guard, page, hooks, navigation types |
| `solid-react-component/login/next` | Login + Next.js adapter |

Future areas (e.g. profile) will follow the same pattern: `solid-react-component/profile`, `solid-react-component/profile/next`, etc.

## Publishing

From the package directory:

```bash
npm run build
npm publish
```

**Repository:** [https://github.com/solid/solidreactcomponent](https://github.com/solid/solidreactcomponent)

## License

MIT
