"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useMemo, ReactNode } from "react";
import type { SolidLoginNavigation, SolidLoginConfig } from "./navigation";
import { SolidLoginNavigationProvider } from "./NavigationContext";
import { AuthGuard } from "./AuthGuard";

/**
 * Next.js adapter: provides navigation from next/navigation so AuthGuard works without manual setup.
 * Must be used inside <Suspense> because it uses useSearchParams().
 */
export function SolidLoginNavigationProviderNext({
  config,
  children,
}: {
  config?: Partial<SolidLoginConfig>;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const navigation: SolidLoginNavigation = useMemo(
    () => ({
      getPathname: () => pathname ?? "/",
      getSearchParams: () => ({
        has: (key: string) => searchParams?.has(key) ?? false,
        get: (key: string) => searchParams?.get(key) ?? null,
      }),
      replace: (path: string) => router.replace(path),
      redirect: (path: string) => {
        if (typeof window !== "undefined") window.location.href = path;
      },
    }),
    [router, pathname, searchParams]
  );

  return (
    <SolidLoginNavigationProvider navigation={navigation} config={config}>
      {children}
    </SolidLoginNavigationProvider>
  );
}

export { AuthGuard } from "./AuthGuard";
export { SolidLoginPage } from "./SolidLoginPage";
