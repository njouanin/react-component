import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { LoginFormControl } from "../../login/LoginFormControl";

// ── Mock @ldo/solid-react ────────────────────────────────────────────────────

const mockLogin = jest.fn();
let mockSession = { isLoggedIn: false };

jest.mock("@ldo/solid-react", () => ({
  useSolidAuth: () => ({
    session: mockSession,
    login: mockLogin,
    ranInitialAuthCheck: true,
  }),
}));

// ── Tests ────────────────────────────────────────────────────────────────────

describe("LoginFormControl", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSession = { isLoggedIn: false };
  });

  it("renders nothing when user is already logged in", () => {
    mockSession.isLoggedIn = true;

    const renderFn = jest.fn(() => <div>Form</div>);
    const { container } = render(
      <LoginFormControl>{renderFn}</LoginFormControl>
    );

    expect(renderFn).not.toHaveBeenCalled();
    expect(container.innerHTML).toBe("");
  });

  it("calls children render prop with correct props", () => {
    const renderFn = jest.fn((props) => (
      <div>
        <span data-testid="issuer">{props.issuerInput}</span>
        <span data-testid="loading">{String(props.isLoading)}</span>
        <span data-testid="error">{props.error ?? "none"}</span>
        <span data-testid="presets">{props.presetIssuers.length}</span>
      </div>
    ));

    render(<LoginFormControl>{renderFn}</LoginFormControl>);

    expect(renderFn).toHaveBeenCalledTimes(1);
    const props = renderFn.mock.calls[0][0];
    expect(props.issuerInput).toBe("");
    expect(props.isLoading).toBe(false);
    expect(props.error).toBeNull();
    expect(props.presetIssuers).toHaveLength(2);
    expect(typeof props.setIssuerInput).toBe("function");
    expect(typeof props.onSubmit).toBe("function");
    expect(typeof props.onIssuerChange).toBe("function");
  });

  it("passes through defaultIssuer and presetIssuers to useSolidLogin", () => {
    const customPresets = [
      { label: "Custom", value: "https://custom.example.com" },
    ];

    const renderFn = jest.fn((props) => (
      <div>
        <span data-testid="issuer">{props.issuerInput}</span>
        <span data-testid="presets">{props.presetIssuers.length}</span>
      </div>
    ));

    render(
      <LoginFormControl
        defaultIssuer="https://my-pod.com"
        presetIssuers={customPresets}
      >
        {renderFn}
      </LoginFormControl>
    );

    const props = renderFn.mock.calls[0][0];
    expect(props.issuerInput).toBe("https://my-pod.com");
    expect(props.presetIssuers).toHaveLength(1);
    expect(props.presetIssuers[0].label).toBe("Custom");
  });

  it("onSubmit prevents default and triggers validation", () => {
    const renderFn = jest.fn((props) => (
      <form onSubmit={props.onSubmit}>
        <button type="submit">Submit</button>
      </form>
    ));

    render(<LoginFormControl>{renderFn}</LoginFormControl>);

    const form = screen.getByRole("button", { name: "Submit" }).closest("form")!;
    const submitEvent = new Event("submit", { bubbles: true, cancelable: true });
    const preventDefaultSpy = jest.spyOn(submitEvent, "preventDefault");

    fireEvent(form, submitEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it("onIssuerChange updates the issuer input", () => {
    const renderFn = jest.fn((props) => (
      <div>
        <input
          data-testid="input"
          value={props.issuerInput}
          onChange={(e) => props.onIssuerChange(e.target.value)}
        />
      </div>
    ));

    const { rerender } = render(
      <LoginFormControl>{renderFn}</LoginFormControl>
    );

    // Initially empty
    expect(renderFn.mock.calls[0][0].issuerInput).toBe("");

    // Simulate change
    fireEvent.change(screen.getByTestId("input"), {
      target: { value: "https://example.com" },
    });

    // The render function should be called again with the updated value
    const lastCall = renderFn.mock.calls[renderFn.mock.calls.length - 1][0];
    expect(lastCall.issuerInput).toBe("https://example.com");
  });
});
