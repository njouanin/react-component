import { DEFAULT_CONFIG } from "../../login/navigation";
import type { SolidLoginNavigation, SolidLoginConfig } from "../../login/navigation";

describe("navigation.ts", () => {
  describe("DEFAULT_CONFIG", () => {
    it("has loginPath set to '/login'", () => {
      expect(DEFAULT_CONFIG.loginPath).toBe("/login");
    });

    it("has homePath set to '/'", () => {
      expect(DEFAULT_CONFIG.homePath).toBe("/");
    });
  });

  describe("SolidLoginNavigation interface", () => {
    it("can be implemented with the required methods", () => {
      const nav: SolidLoginNavigation = {
        getPathname: () => "/test",
        getSearchParams: () => ({
          has: (key: string) => key === "foo",
          get: (key: string) => (key === "foo" ? "bar" : null),
        }),
        replace: (_path: string) => {},
        redirect: (_path: string) => {},
      };

      expect(nav.getPathname()).toBe("/test");
      expect(nav.getSearchParams().has("foo")).toBe(true);
      expect(nav.getSearchParams().get("foo")).toBe("bar");
      expect(nav.getSearchParams().has("missing")).toBe(false);
      expect(nav.getSearchParams().get("missing")).toBeNull();
    });
  });
});
