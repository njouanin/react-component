/**
 * Navigation interface for auth redirects and route checks.
 * Implement this (e.g. via Next.js useRouter/usePathname/useSearchParams)
 * and provide it through SolidLoginNavigationContext so AuthGuard works in any React app.
 */
export interface SolidLoginNavigation {
  /** Current pathname, e.g. "/login" */
  getPathname: () => string;
  /** Read-only view of search params; must support .has(key) and .get(key) */
  getSearchParams: () => { has: (key: string) => boolean; get: (key: string) => string | null };
  /** Navigate to path (replace current history entry). Used for redirect to login or home. */
  replace: (path: string) => void;
  /** Full page redirect (e.g. window.location.href). Used after OAuth callback to clear URL. */
  redirect: (path: string) => void;
}

export interface SolidLoginConfig {
  /** Path for the login page, e.g. "/login". AuthGuard redirects here when not authenticated. */
  loginPath: string;
  /** Path after successful login, e.g. "/". */
  homePath: string;
}

export const DEFAULT_CONFIG: SolidLoginConfig = {
  loginPath: "/login",
  homePath: "/",
};
