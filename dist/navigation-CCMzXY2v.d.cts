import * as react_jsx_runtime from 'react/jsx-runtime';
import { ReactNode } from 'react';
import * as _inrupt_solid_client_authn_core from '@inrupt/solid-client-authn-core';
import { ILoginInputOptions } from '@inrupt/solid-client-authn-core';

interface AuthGuardProps {
    children: ReactNode;
    /** Shown while session is being checked or OAuth callback is in progress */
    fallback?: ReactNode;
}
declare function AuthGuard(props: AuthGuardProps): react_jsx_runtime.JSX.Element;

type LoginOptions = ILoginInputOptions;

interface PresetIssuer {
    label: string;
    value: string;
    secondaryLabel?: string;
}
declare function validateIssuerUrl(url: string): {
    valid: boolean;
    error: string | null;
};
interface UseSolidLoginOptions {
    defaultIssuer?: string;
    presetIssuers?: PresetIssuer[];
    onAlreadyLoggedIn?: () => void;
}
declare function useSolidLogin(options?: UseSolidLoginOptions): {
    session: _inrupt_solid_client_authn_core.ISessionInfo;
    issuerInput: string;
    setIssuerInput: (value: string) => void;
    isLoading: boolean;
    error: string | null;
    presetIssuers: PresetIssuer[];
    validateAndSubmit: () => Promise<boolean>;
    login: (issuer: string, loginOptions?: LoginOptions) => Promise<void>;
};

interface SolidLoginPageProps {
    /** Redirect when already logged in (e.g. router.replace("/")) */
    onAlreadyLoggedIn?: () => void;
    defaultIssuer?: string;
    presetIssuers?: PresetIssuer[];
    /** Logo: pass URL from the app (e.g. "/file-manager-logo.svg") - not shipped in package */
    logo?: string;
    logoAlt?: string;
    title?: string;
    subtitle?: string;
    inputPlaceholder?: string;
    inputLabel?: string;
    buttonLabel?: string;
    buttonLoadingLabel?: string;
    className?: string;
    /** Optional footer links (same as original GitHubLinks horizontal) */
    footerGitHubUrl?: string;
    footerIssuesUrl?: string;
    /** Slots: replace parts of the default UI */
    renderLogo?: () => ReactNode;
    renderForm?: (props: {
        issuerInput: string;
        setIssuerInput: (v: string) => void;
        error: string | null;
        presetIssuers: PresetIssuer[];
        isLoading: boolean;
        onSubmit: (e: React.FormEvent) => void;
        onIssuerChange: (v: string) => void;
    }) => ReactNode;
    renderFooter?: () => ReactNode;
}
declare function SolidLoginPage({ onAlreadyLoggedIn, defaultIssuer, presetIssuers, logo, logoAlt, title, subtitle, inputPlaceholder, inputLabel, buttonLabel, buttonLoadingLabel, className, footerGitHubUrl, footerIssuesUrl, renderLogo, renderForm, renderFooter, }: SolidLoginPageProps): react_jsx_runtime.JSX.Element | null;

/**
 * Navigation interface for auth redirects and route checks.
 * Implement this (e.g. via Next.js useRouter/usePathname/useSearchParams)
 * and provide it through SolidLoginNavigationContext so AuthGuard works in any React app.
 */
interface SolidLoginNavigation {
    /** Current pathname, e.g. "/login" */
    getPathname: () => string;
    /** Read-only view of search params; must support .has(key) and .get(key) */
    getSearchParams: () => {
        has: (key: string) => boolean;
        get: (key: string) => string | null;
    };
    /** Navigate to path (replace current history entry). Used for redirect to login or home. */
    replace: (path: string) => void;
    /** Full page redirect (e.g. window.location.href). Used after OAuth callback to clear URL. */
    redirect: (path: string) => void;
}
interface SolidLoginConfig {
    /** Path for the login page, e.g. "/login". AuthGuard redirects here when not authenticated. */
    loginPath: string;
    /** Path after successful login, e.g. "/". */
    homePath: string;
}
declare const DEFAULT_CONFIG: SolidLoginConfig;

export { AuthGuard as A, DEFAULT_CONFIG as D, type PresetIssuer as P, type SolidLoginConfig as S, SolidLoginPage as a, type SolidLoginNavigation as b, type SolidLoginPageProps as c, useSolidLogin as u, validateIssuerUrl as v };
