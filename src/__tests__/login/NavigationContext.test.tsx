import React from "react";
import { render } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import {
  SolidLoginNavigationProvider,
  useSolidLoginNavigation,
} from "../../login/NavigationContext";
import type { SolidLoginNavigation } from "../../login/navigation";

const mockNavigation: SolidLoginNavigation = {
  getPathname: () => "/current",
  getSearchParams: () => ({
    has: (key: string) => key === "test",
    get: (key: string) => (key === "test" ? "value" : null),
  }),
  replace: jest.fn(),
  redirect: jest.fn(),
};

describe("NavigationContext.tsx", () => {
  describe("useSolidLoginNavigation", () => {
    it("returns null when used outside of SolidLoginNavigationProvider", () => {
      const { result } = renderHook(() => useSolidLoginNavigation());
      expect(result.current).toBeNull();
    });

    it("returns navigation and config when used inside provider", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SolidLoginNavigationProvider navigation={mockNavigation}>
          {children}
        </SolidLoginNavigationProvider>
      );

      const { result } = renderHook(() => useSolidLoginNavigation(), {
        wrapper,
      });

      expect(result.current).not.toBeNull();
      expect(result.current!.navigation).toBe(mockNavigation);
      expect(result.current!.config).toBeDefined();
    });
  });

  describe("SolidLoginNavigationProvider", () => {
    it("uses default config when no config prop is provided", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SolidLoginNavigationProvider navigation={mockNavigation}>
          {children}
        </SolidLoginNavigationProvider>
      );

      const { result } = renderHook(() => useSolidLoginNavigation(), {
        wrapper,
      });

      expect(result.current!.config.loginPath).toBe("/login");
      expect(result.current!.config.homePath).toBe("/");
    });

    it("merges partial config with defaults", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SolidLoginNavigationProvider
          navigation={mockNavigation}
          config={{ loginPath: "/auth" }}
        >
          {children}
        </SolidLoginNavigationProvider>
      );

      const { result } = renderHook(() => useSolidLoginNavigation(), {
        wrapper,
      });

      expect(result.current!.config.loginPath).toBe("/auth");
      expect(result.current!.config.homePath).toBe("/");
    });

    it("uses full custom config when all values are provided", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SolidLoginNavigationProvider
          navigation={mockNavigation}
          config={{ loginPath: "/sign-in", homePath: "/dashboard" }}
        >
          {children}
        </SolidLoginNavigationProvider>
      );

      const { result } = renderHook(() => useSolidLoginNavigation(), {
        wrapper,
      });

      expect(result.current!.config.loginPath).toBe("/sign-in");
      expect(result.current!.config.homePath).toBe("/dashboard");
    });
  });
});
