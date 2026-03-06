"use client";

import { useEffect, useState, Suspense, ReactNode } from "react";
import { useSolidAuth } from "@ldo/solid-react";
import { useSolidLoginNavigation } from "./NavigationContext";

function hasSessionInStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const keys = Object.keys(localStorage);
    return keys.some(
      (key) =>
        key.includes("solidClientAuthn") ||
        key.includes("solid-auth") ||
        key.includes("oidc") ||
        key.includes("session")
    );
  } catch {
    return false;
  }
}

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
  const { session } = useSolidAuth();
  const nav = useSolidLoginNavigation();

  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasSessionIndicator] = useState(() => hasSessionInStorage());
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
  const hasSessionData = !!(session.webId || session.sessionId || (session as { clientAppId?: string }).clientAppId);

  useEffect(() => {
    if (session.isLoggedIn) setWasLoggedIn(true);

    if (isOAuthCallback) {
      setIsCheckingSession(true);
      if (session.isLoggedIn) {
        setIsCheckingSession(false);
        const t = setTimeout(() => navigation.redirect(config.homePath), 200);
        return () => clearTimeout(t);
      }
      const maxWait = setTimeout(() => setIsCheckingSession(false), 10000);
      return () => clearTimeout(maxWait);
    }

    if (session.isLoggedIn) {
      setIsCheckingSession(false);
      if (isLoginPage) navigation.replace(config.homePath);
      return;
    }

    if (wasLoggedIn && !session.isLoggedIn) {
      setIsCheckingSession(false);
      if (!isLoginPage) navigation.replace(config.loginPath);
      return;
    }

    const shouldWait = hasSessionData || hasSessionIndicator;
    const t = setTimeout(() => {
      setIsCheckingSession(false);
      if (!session.isLoggedIn && !isLoginPage && !isOAuthCallback) {
        navigation.replace(config.loginPath);
      }
    }, shouldWait ? 2000 : 200);
    return () => clearTimeout(t);
  }, [
    session.isLoggedIn,
    session.webId,
    session.sessionId,
    isOAuthCallback,
    hasSessionIndicator,
    hasSessionData,
    wasLoggedIn,
    isLoginPage,
    config.loginPath,
    config.homePath,
    navigation,
  ]);

  if (isCheckingSession || isOAuthCallback) return <>{fallback}</>;
  if (isOAuthCallback && isLoginPage) return <>{fallback}</>;
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
