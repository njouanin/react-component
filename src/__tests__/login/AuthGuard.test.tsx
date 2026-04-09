import React from "react";
import { render, screen } from "@testing-library/react";
import { AuthGuard } from "../../login/AuthGuard";
import { SolidLoginNavigationProvider } from "../../login/NavigationContext";
import type { SolidLoginNavigation } from "../../login/navigation";

// ── Mock @ldo/solid-react ────────────────────────────────────────────────────

let mockSession = { isLoggedIn: false, webId: undefined as string | undefined };
let mockRanInitialAuthCheck = true;

jest.mock("@ldo/solid-react", () => ({
  useSolidAuth: () => ({
    session: mockSession,
    login: jest.fn(),
    ranInitialAuthCheck: mockRanInitialAuthCheck,
  }),
}));

// ── Navigation helpers ───────────────────────────────────────────────────────

let currentPathname = "/";
let currentSearchParams: Record<string, string> = {};
const mockReplace = jest.fn();
const mockRedirect = jest.fn();

function createMockNavigation(): SolidLoginNavigation {
  return {
    getPathname: () => currentPathname,
    getSearchParams: () => ({
      has: (key: string) => key in currentSearchParams,
      get: (key: string) => currentSearchParams[key] ?? null,
    }),
    replace: mockReplace,
    redirect: mockRedirect,
  };
}

function renderWithProvider(
  ui: React.ReactElement,
  config?: { loginPath?: string; homePath?: string }
) {
  const navigation = createMockNavigation();
  return render(
    <SolidLoginNavigationProvider navigation={navigation} config={config}>
      {ui}
    </SolidLoginNavigationProvider>
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("AuthGuard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSession = { isLoggedIn: false, webId: undefined };
    mockRanInitialAuthCheck = true;
    currentPathname = "/";
    currentSearchParams = {};
    sessionStorage.clear();
  });

  // ── Rendering behavior ─────────────────────────────────────────────────

  describe("rendering behavior", () => {
    it("renders fallback while ranInitialAuthCheck is false", () => {
      mockRanInitialAuthCheck = false;
      currentPathname = "/dashboard";

      renderWithProvider(
        <AuthGuard fallback={<div>Loading...</div>}>
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(screen.getByText("Loading...")).toBeInTheDocument();
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });

    it("renders fallback during OAuth callback (URL has code param)", () => {
      currentPathname = "/login";
      currentSearchParams = { code: "abc123", state: "xyz" };

      renderWithProvider(
        <AuthGuard fallback={<div>Authenticating...</div>}>
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(screen.getByText("Authenticating...")).toBeInTheDocument();
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });

    it("renders fallback during OAuth callback (URL has state param only)", () => {
      currentPathname = "/login";
      currentSearchParams = { state: "xyz" };

      renderWithProvider(
        <AuthGuard fallback={<div>Authenticating...</div>}>
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(screen.getByText("Authenticating...")).toBeInTheDocument();
    });

    it("renders children when logged in and not on login page", () => {
      mockSession.isLoggedIn = true;
      currentPathname = "/dashboard";

      renderWithProvider(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("renders nothing when not logged in and not on login page", () => {
      mockSession.isLoggedIn = false;
      currentPathname = "/dashboard";

      const { container } = renderWithProvider(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
      // The Suspense wrapper may still render, but AuthGuardContent returns null
    });

    it("renders children on login page when not logged in", () => {
      mockSession.isLoggedIn = false;
      currentPathname = "/login";

      renderWithProvider(
        <AuthGuard>
          <div>Login Form</div>
        </AuthGuard>
      );

      expect(screen.getByText("Login Form")).toBeInTheDocument();
    });

    it("renders nothing when logged in and on login page", () => {
      mockSession.isLoggedIn = true;
      currentPathname = "/login";

      renderWithProvider(
        <AuthGuard>
          <div>Login Form</div>
        </AuthGuard>
      );

      expect(screen.queryByText("Login Form")).not.toBeInTheDocument();
    });

    it("uses default fallback when none provided", () => {
      mockRanInitialAuthCheck = false;
      currentPathname = "/dashboard";

      renderWithProvider(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      // Default fallback contains "Loading..."
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
  });

  // ── Without provider ───────────────────────────────────────────────────

  describe("without SolidLoginNavigationProvider", () => {
    it("renders children and warns in dev mode", () => {
      const consoleWarnSpy = jest
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      render(
        <AuthGuard>
          <div>Unprotected Content</div>
        </AuthGuard>
      );

      expect(screen.getByText("Unprotected Content")).toBeInTheDocument();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("AuthGuard requires SolidLoginNavigationProvider")
      );

      consoleWarnSpy.mockRestore();
    });
  });

  // ── Redirect logic ─────────────────────────────────────────────────────

  describe("redirect logic", () => {
    it("redirects to login page when not authenticated on a protected route", () => {
      mockSession.isLoggedIn = false;
      currentPathname = "/dashboard";

      renderWithProvider(
        <AuthGuard>
          <div>Protected</div>
        </AuthGuard>
      );

      expect(mockReplace).toHaveBeenCalledWith(
        "/login?returnTo=%2Fdashboard"
      );
    });

    it("includes returnTo param when redirecting from a non-home protected route", () => {
      mockSession.isLoggedIn = false;
      currentPathname = "/dashboard/settings";

      renderWithProvider(
        <AuthGuard>
          <div>Protected</div>
        </AuthGuard>
      );

      expect(mockReplace).toHaveBeenCalledWith(
        "/login?returnTo=%2Fdashboard%2Fsettings"
      );
    });

    it("does NOT include returnTo when redirecting from home path", () => {
      mockSession.isLoggedIn = false;
      currentPathname = "/";

      renderWithProvider(
        <AuthGuard>
          <div>Protected</div>
        </AuthGuard>
      );

      expect(mockReplace).toHaveBeenCalledWith("/login");
    });

    it("redirects to homePath when logged in on login page", () => {
      mockSession.isLoggedIn = true;
      currentPathname = "/login";

      renderWithProvider(
        <AuthGuard>
          <div>Login Form</div>
        </AuthGuard>
      );

      expect(mockReplace).toHaveBeenCalledWith("/");
    });

    it("redirects to returnTo path after OAuth callback completes", () => {
      mockSession.isLoggedIn = true;
      currentPathname = "/login";
      currentSearchParams = { code: "abc", state: "xyz", returnTo: "/dashboard" };

      renderWithProvider(
        <AuthGuard>
          <div>Content</div>
        </AuthGuard>
      );

      expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
    });

    it("redirects to homePath when returnTo is missing after callback", () => {
      mockSession.isLoggedIn = true;
      currentPathname = "/login";
      currentSearchParams = { code: "abc", state: "xyz" };

      renderWithProvider(
        <AuthGuard>
          <div>Content</div>
        </AuthGuard>
      );

      expect(mockRedirect).toHaveBeenCalledWith("/");
    });

    it("uses navigation.redirect() for OAuth callback redirects (full page reload)", () => {
      mockSession.isLoggedIn = true;
      currentPathname = "/login";
      currentSearchParams = { code: "abc", state: "xyz" };

      renderWithProvider(
        <AuthGuard>
          <div>Content</div>
        </AuthGuard>
      );

      expect(mockRedirect).toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it("uses navigation.replace() for in-app redirects (logged in on login page)", () => {
      mockSession.isLoggedIn = true;
      currentPathname = "/login";
      // No code/state params — not an OAuth callback
      currentSearchParams = {};

      renderWithProvider(
        <AuthGuard>
          <div>Content</div>
        </AuthGuard>
      );

      expect(mockReplace).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("ignores invalid returnTo values (e.g. //evil.com)", () => {
      mockSession.isLoggedIn = true;
      currentPathname = "/login";
      currentSearchParams = { code: "abc", state: "xyz", returnTo: "//evil.com" };

      renderWithProvider(
        <AuthGuard>
          <div>Content</div>
        </AuthGuard>
      );

      // Should fall through to homePath since //evil.com is invalid
      expect(mockRedirect).toHaveBeenCalledWith("/");
    });

    it("ignores empty returnTo value", () => {
      mockSession.isLoggedIn = true;
      currentPathname = "/login";
      currentSearchParams = { code: "abc", state: "xyz", returnTo: "" };

      renderWithProvider(
        <AuthGuard>
          <div>Content</div>
        </AuthGuard>
      );

      expect(mockRedirect).toHaveBeenCalledWith("/");
    });
  });

  // ── sessionStorage persistence ─────────────────────────────────────────

  describe("sessionStorage returnTo persistence", () => {
    it("persists returnTo to sessionStorage when arriving at login page with param", () => {
      mockSession.isLoggedIn = false;
      currentPathname = "/login";
      currentSearchParams = { returnTo: "/dashboard" };

      renderWithProvider(
        <AuthGuard>
          <div>Login Form</div>
        </AuthGuard>
      );

      expect(sessionStorage.getItem("solid-login-returnTo")).toBe("/dashboard");
    });

    it("reads returnTo from sessionStorage when URL param is missing after callback", () => {
      sessionStorage.setItem("solid-login-returnTo", "/settings");
      mockSession.isLoggedIn = true;
      currentPathname = "/login";
      currentSearchParams = { code: "abc", state: "xyz" };

      renderWithProvider(
        <AuthGuard>
          <div>Content</div>
        </AuthGuard>
      );

      expect(mockRedirect).toHaveBeenCalledWith("/settings");
    });

    it("clears returnTo from sessionStorage after successful redirect", () => {
      sessionStorage.setItem("solid-login-returnTo", "/settings");
      mockSession.isLoggedIn = true;
      currentPathname = "/login";
      currentSearchParams = { code: "abc", state: "xyz" };

      renderWithProvider(
        <AuthGuard>
          <div>Content</div>
        </AuthGuard>
      );

      expect(sessionStorage.getItem("solid-login-returnTo")).toBeNull();
    });

    it("saves current path to sessionStorage when redirecting unauthenticated user to login", () => {
      mockSession.isLoggedIn = false;
      currentPathname = "/dashboard/settings";

      renderWithProvider(
        <AuthGuard>
          <div>Protected</div>
        </AuthGuard>
      );

      expect(sessionStorage.getItem("solid-login-returnTo")).toBe(
        "/dashboard/settings"
      );
    });
  });

  // ── Edge cases ─────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("handles sessionStorage being unavailable", () => {
      // Override sessionStorage methods to throw (simulates Safari private mode)
      const origGetItem = Storage.prototype.getItem;
      const origSetItem = Storage.prototype.setItem;
      const origRemoveItem = Storage.prototype.removeItem;

      Storage.prototype.getItem = () => {
        throw new Error("SecurityError");
      };
      Storage.prototype.setItem = () => {
        throw new Error("SecurityError");
      };
      Storage.prototype.removeItem = () => {
        throw new Error("SecurityError");
      };

      mockSession.isLoggedIn = false;
      currentPathname = "/dashboard";

      // Should not throw
      expect(() => {
        renderWithProvider(
          <AuthGuard>
            <div>Protected</div>
          </AuthGuard>
        );
      }).not.toThrow();

      // Should still redirect to login
      expect(mockReplace).toHaveBeenCalled();

      // Restore
      Storage.prototype.getItem = origGetItem;
      Storage.prototype.setItem = origSetItem;
      Storage.prototype.removeItem = origRemoveItem;
    });

    it("works with custom loginPath and homePath config", () => {
      mockSession.isLoggedIn = false;
      currentPathname = "/dashboard";

      renderWithProvider(
        <AuthGuard>
          <div>Protected</div>
        </AuthGuard>,
        { loginPath: "/auth", homePath: "/home" }
      );

      expect(mockReplace).toHaveBeenCalledWith(
        "/auth?returnTo=%2Fdashboard"
      );
    });

    it("does not redirect when initial auth check has not run yet", () => {
      mockRanInitialAuthCheck = false;
      mockSession.isLoggedIn = false;
      currentPathname = "/dashboard";

      renderWithProvider(
        <AuthGuard fallback={<div>Loading...</div>}>
          <div>Protected</div>
        </AuthGuard>
      );

      expect(mockReplace).not.toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
  });
});
