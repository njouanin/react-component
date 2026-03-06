"use client";

import { createContext, useContext, ReactNode } from "react";
import type { SolidLoginNavigation, SolidLoginConfig } from "./navigation";

type NavigationContextValue = {
  navigation: SolidLoginNavigation;
  config: SolidLoginConfig;
} | null;

const SolidLoginNavigationContext = createContext<NavigationContextValue>(null);

export function SolidLoginNavigationProvider({
  navigation,
  config,
  children,
}: {
  navigation: SolidLoginNavigation;
  config?: Partial<SolidLoginConfig>;
  children: ReactNode;
}) {
  const fullConfig: SolidLoginConfig = {
    loginPath: config?.loginPath ?? "/login",
    homePath: config?.homePath ?? "/",
  };
  return (
    <SolidLoginNavigationContext.Provider value={{ navigation, config: fullConfig }}>
      {children}
    </SolidLoginNavigationContext.Provider>
  );
}

export function useSolidLoginNavigation(): NavigationContextValue {
  return useContext(SolidLoginNavigationContext);
}
