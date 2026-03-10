"use client";

import { useEffect, useState, Suspense, ReactNode } from "react";
import { useSolidAuth } from "@ldo/solid-react";
import { useSolidLoginNavigation } from "./NavigationContext";

const REDIRECT_RETURN_TO_KEY = "solid-login-returnTo";

export interface AuthGuardProps {
  children: ReactNode;
  /** Shown while session is being checked or OAuth callback is in progress */
  fallback?: ReactNode;
}

const defaultFallback = (
  <div
    style={{
      display: "flex",
      minHeight: "100vh",
      alignItems: "center",
      justifyContent: "center",
      background: "#fff",
    }}
  >
    <span>Loading...</span>
  </div>
);

function AuthGuardContent({ children, fallback = defaultFallback }: AuthGuardProps) {
  const { session, ranInitialAuthCheck = true } = useSolidAuth();
  const nav = useSolidLoginNavigation();

  const [wasLoggedIn, setWasLoggedIn] = useState(false);

  if (!nav) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "solid-react-component: AuthGuard requires SolidLoginNavigationProvider (or use 'solid-react-component/login/next')"
      );
    }
    return <>{children}</>;
  }

  const { navigation, config } = nav;
  const searchParams = navigation.getSearchParams();
  const pathname = navigation.getPathname();
  const isOAuthCallback = searchParams.has("code") || searchParams.has("state");
  const isLoginPage = pathname === config.loginPath;

  const redirectToLogin = () => {
    const current = pathname || "/";
    if (current === config.loginPath || current === config.homePath) {
      navigation.replace(config.loginPath);
    } else {
      const returnTo = encodeURIComponent(current);
      navigation.replace(`${config.loginPath}?returnTo=${returnTo}`);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined" || !isLoginPage || session.isLoggedIn) return;
    const returnTo = searchParams.get("returnTo");
    if (returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")) {
      try {
        sessionStorage.setItem(REDIRECT_RETURN_TO_KEY, returnTo);
      } catch {
        /* ignore */
      }
    }
  }, [isLoginPage, session.isLoggedIn]);

  useEffect(() => {
    if (session.isLoggedIn) setWasLoggedIn(true);

    if (isOAuthCallback) {
      if (session.isLoggedIn) {
        let target = config.homePath;
        const returnToUrl = searchParams.get("returnTo");
        if (returnToUrl && returnToUrl.startsWith("/") && !returnToUrl.startsWith("//")) {
          target = returnToUrl;
        } else if (typeof window !== "undefined") {
          try {
            const stored = sessionStorage.getItem(REDIRECT_RETURN_TO_KEY);
            if (stored && stored.startsWith("/") && !stored.startsWith("//")) {
              target = stored;
            }
            sessionStorage.removeItem(REDIRECT_RETURN_TO_KEY);
          } catch {
            /* ignore */
          }
        }
        const t = setTimeout(() => navigation.redirect(target), 200);
        return () => clearTimeout(t);
      }
      return;
    }

    if (!ranInitialAuthCheck) return;

    if (session.isLoggedIn) {
      if (isLoginPage) {
        let target = config.homePath;
        const returnToUrl = searchParams.get("returnTo");
        if (returnToUrl && returnToUrl.startsWith("/") && !returnToUrl.startsWith("//")) {
          target = returnToUrl;
        } else if (typeof window !== "undefined") {
          try {
            const stored = sessionStorage.getItem(REDIRECT_RETURN_TO_KEY);
            if (stored && stored.startsWith("/") && !stored.startsWith("//")) {
              target = stored;
            }
            sessionStorage.removeItem(REDIRECT_RETURN_TO_KEY);
          } catch {
            /* ignore */
          }
        }
        navigation.replace(target);
      }
      return;
    }

    if (wasLoggedIn && !session.isLoggedIn) {
      if (!isLoginPage) redirectToLogin();
      return;
    }

    if (!session.isLoggedIn && !isLoginPage) {
      redirectToLogin();
    }
  }, [
    ranInitialAuthCheck,
    session.isLoggedIn,
    session.webId,
    session.sessionId,
    isOAuthCallback,
    wasLoggedIn,
    isLoginPage,
    config.loginPath,
    config.homePath,
    navigation,
  ]);

  if (!ranInitialAuthCheck) return <>{fallback}</>;
  if (isOAuthCallback) return <>{fallback}</>;
  if (!session.isLoggedIn && !isLoginPage) return null;
  if (session.isLoggedIn && isLoginPage) return null;
  return <>{children}</>;
}

export function AuthGuard(props: AuthGuardProps) {
  return (
    <Suspense fallback={props.fallback ?? defaultFallback}>
      <AuthGuardContent {...props} />
    </Suspense>
  );
}
