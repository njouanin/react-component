import React from "react";
import { render } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { useSolidLoginNavigation } from "../../login/NavigationContext";

// ── Mock next/navigation ─────────────────────────────────────────────────────

const mockRouterReplace = jest.fn();
let mockPathname = "/";
let mockSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockRouterReplace,
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

// ── Mock @ldo/solid-react ────────────────────────────────────────────────────

jest.mock("@ldo/solid-react", () => ({
  useSolidAuth: () => ({
    session: { isLoggedIn: false },
    login: jest.fn(),
    ranInitialAuthCheck: true,
  }),
}));

// ── Import after mocks ──────────────────────────────────────────────────────

import { SolidLoginNavigationProviderNext } from "../../login/next";

// ── Tests ────────────────────────────────────────────────────────────────────

describe("next.tsx adapter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = "/";
    mockSearchParams = new URLSearchParams();
  });

  describe("SolidLoginNavigationProviderNext", () => {
    it("provides navigation context to children", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SolidLoginNavigationProviderNext>
          {children}
        </SolidLoginNavigationProviderNext>
      );

      const { result } = renderHook(() => useSolidLoginNavigation(), {
        wrapper,
      });

      expect(result.current).not.toBeNull();
      expect(result.current!.navigation).toBeDefined();
      expect(result.current!.config).toBeDefined();
    });

    it("getPathname() returns current pathname from Next.js", () => {
      mockPathname = "/dashboard";

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SolidLoginNavigationProviderNext>
          {children}
        </SolidLoginNavigationProviderNext>
      );

      const { result } = renderHook(() => useSolidLoginNavigation(), {
        wrapper,
      });

      expect(result.current!.navigation.getPathname()).toBe("/dashboard");
    });

    it("getSearchParams() returns working .has() and .get()", () => {
      mockSearchParams = new URLSearchParams("code=abc&returnTo=/settings");

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SolidLoginNavigationProviderNext>
          {children}
        </SolidLoginNavigationProviderNext>
      );

      const { result } = renderHook(() => useSolidLoginNavigation(), {
        wrapper,
      });

      const sp = result.current!.navigation.getSearchParams();
      expect(sp.has("code")).toBe(true);
      expect(sp.get("code")).toBe("abc");
      expect(sp.get("returnTo")).toBe("/settings");
      expect(sp.has("missing")).toBe(false);
      expect(sp.get("missing")).toBeNull();
    });

    it("replace() calls router.replace()", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SolidLoginNavigationProviderNext>
          {children}
        </SolidLoginNavigationProviderNext>
      );

      const { result } = renderHook(() => useSolidLoginNavigation(), {
        wrapper,
      });

      result.current!.navigation.replace("/new-path");
      expect(mockRouterReplace).toHaveBeenCalledWith("/new-path");
    });

    it("redirect() is a function that can be called", () => {
      // Note: window.location.href cannot be spied on in jsdom because the
      // property is non-configurable. We verify the function exists and is
      // callable. The actual navigation.redirect implementation sets
      // window.location.href which triggers a full page redirect in browsers.
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SolidLoginNavigationProviderNext>
          {children}
        </SolidLoginNavigationProviderNext>
      );

      const { result } = renderHook(() => useSolidLoginNavigation(), {
        wrapper,
      });

      expect(typeof result.current!.navigation.redirect).toBe("function");
      // Calling it should not throw (jsdom will navigate and may log an error
      // for unsupported URLs, but the function itself should not throw)
    });

    it("passes config to underlying SolidLoginNavigationProvider", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SolidLoginNavigationProviderNext
          config={{ loginPath: "/auth", homePath: "/home" }}
        >
          {children}
        </SolidLoginNavigationProviderNext>
      );

      const { result } = renderHook(() => useSolidLoginNavigation(), {
        wrapper,
      });

      expect(result.current!.config.loginPath).toBe("/auth");
      expect(result.current!.config.homePath).toBe("/home");
    });

    it("uses default config when no config prop provided", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SolidLoginNavigationProviderNext>
          {children}
        </SolidLoginNavigationProviderNext>
      );

      const { result } = renderHook(() => useSolidLoginNavigation(), {
        wrapper,
      });

      expect(result.current!.config.loginPath).toBe("/login");
      expect(result.current!.config.homePath).toBe("/");
    });
  });

  describe("re-exports", () => {
    it("re-exports AuthGuard and SolidLoginPage", () => {
      const nextModule = require("../../login/next");
      expect(nextModule.AuthGuard).toBeDefined();
      expect(nextModule.SolidLoginPage).toBeDefined();
    });
  });
});
