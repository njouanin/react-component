import { renderHook, act } from "@testing-library/react";
import { validateIssuerUrl, useSolidLogin } from "../../login/useSolidLogin";
import type { PresetIssuer } from "../../login/useSolidLogin";

// ── Mock @ldo/solid-react ────────────────────────────────────────────────────

const mockLogin = jest.fn();
const mockSession = { isLoggedIn: false, webId: undefined };

jest.mock("@ldo/solid-react", () => ({
  useSolidAuth: () => ({
    session: mockSession,
    login: mockLogin,
    ranInitialAuthCheck: true,
  }),
}));

// ── Tests ────────────────────────────────────────────────────────────────────

describe("validateIssuerUrl", () => {
  it("returns error for empty string", () => {
    const result = validateIssuerUrl("");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Please enter a Solid Identity Provider URL");
  });

  it("returns error for whitespace-only string", () => {
    const result = validateIssuerUrl("   ");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Please enter a Solid Identity Provider URL");
  });

  it("returns error for invalid URL", () => {
    const result = validateIssuerUrl("not-a-url");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Please enter a valid URL");
  });

  it("returns error for non-http/https protocol (ftp)", () => {
    const result = validateIssuerUrl("ftp://example.com");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("URL must start with http:// or https://");
  });

  it("returns error for non-http/https protocol (file)", () => {
    const result = validateIssuerUrl("file:///etc/passwd");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("URL must start with http:// or https://");
  });

  it("returns valid for https URL", () => {
    const result = validateIssuerUrl("https://solidcommunity.net");
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  it("returns valid for http URL", () => {
    const result = validateIssuerUrl("http://localhost:3000");
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  it("returns valid for URL with trailing slash", () => {
    const result = validateIssuerUrl("https://solidcommunity.net/");
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  it("returns valid for URL with path", () => {
    const result = validateIssuerUrl("https://example.com/path/to/issuer");
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });
});

describe("useSolidLogin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSession.isLoggedIn = false;
    mockSession.webId = undefined;
  });

  it("returns default state with empty issuer, not loading, no error", () => {
    const { result } = renderHook(() => useSolidLogin());

    expect(result.current.issuerInput).toBe("");
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("returns the session from useSolidAuth", () => {
    const { result } = renderHook(() => useSolidLogin());

    expect(result.current.session).toBe(mockSession);
  });

  it("returns default preset issuers when none provided", () => {
    const { result } = renderHook(() => useSolidLogin());

    expect(result.current.presetIssuers).toHaveLength(2);
    expect(result.current.presetIssuers[0].label).toBe("Solid Community");
    expect(result.current.presetIssuers[1].label).toBe("Inrupt");
  });

  it("initializes with defaultIssuer when provided", () => {
    const { result } = renderHook(() =>
      useSolidLogin({ defaultIssuer: "https://my-pod.example.com" })
    );

    expect(result.current.issuerInput).toBe("https://my-pod.example.com");
  });

  it("uses custom presetIssuers when provided", () => {
    const custom: PresetIssuer[] = [
      { label: "Custom", value: "https://custom.example.com" },
    ];
    const { result } = renderHook(() =>
      useSolidLogin({ presetIssuers: custom })
    );

    expect(result.current.presetIssuers).toHaveLength(1);
    expect(result.current.presetIssuers[0].label).toBe("Custom");
  });

  it("setIssuerInput updates the issuer value and clears error", () => {
    const { result } = renderHook(() => useSolidLogin());

    // First trigger an error
    act(() => {
      result.current.validateAndSubmit();
    });
    expect(result.current.error).not.toBeNull();

    // Then update issuer — error should clear
    act(() => {
      result.current.setIssuerInput("https://example.com");
    });
    expect(result.current.issuerInput).toBe("https://example.com");
    expect(result.current.error).toBeNull();
  });

  it("validateAndSubmit sets error for invalid URL and returns false", async () => {
    const { result } = renderHook(() => useSolidLogin());

    let returnValue: boolean;
    await act(async () => {
      returnValue = await result.current.validateAndSubmit();
    });

    expect(returnValue!).toBe(false);
    expect(result.current.error).toBe(
      "Please enter a Solid Identity Provider URL"
    );
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("validateAndSubmit calls login() with trimmed URL for valid input", async () => {
    mockLogin.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useSolidLogin());

    act(() => {
      result.current.setIssuerInput("  https://solidcommunity.net/  ");
    });

    await act(async () => {
      await result.current.validateAndSubmit();
    });

    expect(mockLogin).toHaveBeenCalledWith(
      "https://solidcommunity.net/",
      undefined
    );
  });

  it("validateAndSubmit passes redirectUrl option when provided", async () => {
    mockLogin.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() =>
      useSolidLogin({ redirectUrl: "https://myapp.com/callback" })
    );

    act(() => {
      result.current.setIssuerInput("https://solidcommunity.net/");
    });

    await act(async () => {
      await result.current.validateAndSubmit();
    });

    expect(mockLogin).toHaveBeenCalledWith("https://solidcommunity.net/", {
      redirectUrl: "https://myapp.com/callback",
    });
  });

  it("validateAndSubmit sets isLoading to true during login", async () => {
    // Make login hang so we can observe isLoading
    let resolveLogin: () => void;
    mockLogin.mockImplementationOnce(
      () => new Promise<void>((resolve) => (resolveLogin = resolve))
    );

    const { result } = renderHook(() => useSolidLogin());

    act(() => {
      result.current.setIssuerInput("https://solidcommunity.net/");
    });

    // Start login (don't await)
    let submitPromise: Promise<boolean>;
    act(() => {
      submitPromise = result.current.validateAndSubmit();
    });

    // isLoading should be true while login is in progress
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();

    // Resolve login
    await act(async () => {
      resolveLogin!();
      await submitPromise;
    });
  });

  it("validateAndSubmit handles login failure gracefully", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockLogin.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useSolidLogin());

    act(() => {
      result.current.setIssuerInput("https://solidcommunity.net/");
    });

    let returnValue: boolean;
    await act(async () => {
      returnValue = await result.current.validateAndSubmit();
    });

    expect(returnValue!).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Login failed:",
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });
});
