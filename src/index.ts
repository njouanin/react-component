/**
 * @solid/react-components
 *
 * Reusable React components for Solid apps. Each area (login, profile, etc.) is
 * available under its own subpath for tree-shaking and clear imports.
 *
 * Current components:
 * - Login: @solid/react-components/login or @solid/react-components/login/next (Next.js)
 */

export {
  AuthGuard,
  SolidLoginPage,
  LoginFormControl,
  useSolidLogin,
  validateIssuerUrl,
  SolidLoginNavigationProvider,
  useSolidLoginNavigation,
  DEFAULT_CONFIG,
} from "./login";
export type {
  PresetIssuer,
  SolidLoginNavigation,
  SolidLoginConfig,
} from "./login";
