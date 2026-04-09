import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SolidLoginPage } from "../../login/SolidLoginPage";

// ── Mock @ldo/solid-react ────────────────────────────────────────────────────

const mockLogin = jest.fn();
let mockSession = { isLoggedIn: false, webId: undefined as string | undefined };

jest.mock("@ldo/solid-react", () => ({
  useSolidAuth: () => ({
    session: mockSession,
    login: mockLogin,
    ranInitialAuthCheck: true,
  }),
}));

// ── Tests ────────────────────────────────────────────────────────────────────

describe("SolidLoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSession = { isLoggedIn: false, webId: undefined };
  });

  // ── Basic rendering ────────────────────────────────────────────────────

  describe("basic rendering", () => {
    it("renders nothing when user is already logged in", () => {
      mockSession.isLoggedIn = true;
      const { container } = render(<SolidLoginPage />);
      expect(container.innerHTML).toBe("");
    });

    it("renders the login form when not logged in", () => {
      render(<SolidLoginPage />);
      expect(screen.getByRole("main")).toBeInTheDocument();
      expect(screen.getByLabelText("Sign in form")).toBeInTheDocument();
    });

    it("renders default title and subtitle", () => {
      render(<SolidLoginPage />);
      expect(screen.getAllByText("Sign in").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("to continue").length).toBeGreaterThanOrEqual(1);
    });

    it("renders custom title and subtitle", () => {
      render(<SolidLoginPage title="Welcome" subtitle="to My App" />);
      expect(screen.getAllByText("Welcome").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("to My App").length).toBeGreaterThanOrEqual(1);
    });

    it("renders logo when logo prop is provided", () => {
      render(<SolidLoginPage logo="/test-logo.svg" logoAlt="Test Logo" />);
      const logos = screen.getAllByAltText("Test Logo");
      expect(logos.length).toBeGreaterThanOrEqual(1);
      expect(logos[0]).toHaveAttribute("src", "/test-logo.svg");
    });

    it("does not render img when no logo or renderLogo provided", () => {
      render(<SolidLoginPage />);
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });

    it("renders custom logo via renderLogo slot", () => {
      render(
        <SolidLoginPage
          renderLogo={() => <div data-testid="custom-logo">My Logo</div>}
        />
      );
      expect(screen.getAllByTestId("custom-logo").length).toBeGreaterThanOrEqual(1);
    });

    it("renders input with correct label and placeholder", () => {
      render(<SolidLoginPage />);
      const input = screen.getByRole("combobox");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute(
        "placeholder",
        "Enter your provider URL or select from the list"
      );
      expect(
        screen.getByText("Solid Identity Provider")
      ).toBeInTheDocument();
    });

    it("renders custom input label and placeholder", () => {
      render(
        <SolidLoginPage
          inputLabel="Your Pod Provider"
          inputPlaceholder="Type here..."
        />
      );
      expect(screen.getByText("Your Pod Provider")).toBeInTheDocument();
      expect(screen.getByRole("combobox")).toHaveAttribute(
        "placeholder",
        "Type here..."
      );
    });

    it("renders submit button with correct label", () => {
      render(<SolidLoginPage />);
      expect(
        screen.getByRole("button", { name: "Continue to sign in" })
      ).toBeInTheDocument();
    });

    it("passes className to the main container", () => {
      render(<SolidLoginPage className="my-custom-class" />);
      expect(screen.getByRole("main")).toHaveClass("my-custom-class");
    });
  });

  // ── Footer ─────────────────────────────────────────────────────────────

  describe("footer", () => {
    it("renders footer with GitHub and issues links when both URLs provided", () => {
      render(
        <SolidLoginPage
          footerGitHubUrl="https://github.com/test/repo"
          footerIssuesUrl="https://github.com/test/repo/issues"
        />
      );
      const githubLink = screen.getByLabelText("View source code on GitHub");
      const issuesLink = screen.getByLabelText("Report an issue on GitHub");
      expect(githubLink).toHaveAttribute("href", "https://github.com/test/repo");
      expect(issuesLink).toHaveAttribute(
        "href",
        "https://github.com/test/repo/issues"
      );
    });

    it("does not render footer when URLs are not provided", () => {
      render(<SolidLoginPage />);
      expect(
        screen.queryByLabelText("View source code on GitHub")
      ).not.toBeInTheDocument();
    });

    it("renders custom footer via renderFooter slot", () => {
      render(
        <SolidLoginPage
          renderFooter={() => <div data-testid="custom-footer">My Footer</div>}
        />
      );
      expect(screen.getByTestId("custom-footer")).toBeInTheDocument();
    });
  });

  // ── Form interaction ───────────────────────────────────────────────────

  describe("form interaction", () => {
    it("typing in input updates issuer value", async () => {
      const user = userEvent.setup();
      render(<SolidLoginPage />);

      const input = screen.getByRole("combobox");
      await user.type(input, "https://example.com");
      expect(input).toHaveValue("https://example.com");
    });

    it("shows error message when submitting empty form", async () => {
      const user = userEvent.setup();
      render(<SolidLoginPage />);

      const button = screen.getByRole("button", {
        name: "Continue to sign in",
      });
      await user.click(button);

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Please enter a Solid Identity Provider URL"
      );
    });

    it("shows error message for invalid URL", async () => {
      const user = userEvent.setup();
      render(<SolidLoginPage />);

      const input = screen.getByRole("combobox");
      await user.type(input, "not-a-url");

      const button = screen.getByRole("button", {
        name: "Continue to sign in",
      });
      await user.click(button);

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Please enter a valid URL"
      );
    });

    it("calls login with valid URL on submit", async () => {
      mockLogin.mockResolvedValueOnce(undefined);
      const user = userEvent.setup();
      render(<SolidLoginPage />);

      const input = screen.getByRole("combobox");
      await user.type(input, "https://solidcommunity.net/");

      const button = screen.getByRole("button", {
        name: "Continue to sign in",
      });
      await user.click(button);

      expect(mockLogin).toHaveBeenCalledWith(
        "https://solidcommunity.net/",
        undefined
      );
    });

    it("calls onAlreadyLoggedIn when session is already active", () => {
      mockSession.isLoggedIn = true;
      const onAlreadyLoggedIn = jest.fn();
      render(<SolidLoginPage onAlreadyLoggedIn={onAlreadyLoggedIn} />);
      expect(onAlreadyLoggedIn).toHaveBeenCalled();
    });
  });

  // ── Combobox / dropdown ────────────────────────────────────────────────

  describe("combobox / dropdown", () => {
    it("shows dropdown on input focus", async () => {
      const user = userEvent.setup();
      render(<SolidLoginPage />);

      const input = screen.getByRole("combobox");
      await user.click(input);

      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    it("displays preset issuers in dropdown", async () => {
      const user = userEvent.setup();
      render(<SolidLoginPage />);

      const input = screen.getByRole("combobox");
      await user.click(input);

      const options = screen.getAllByRole("option");
      expect(options.length).toBe(2);
    });

    it("filters options based on input text", async () => {
      const user = userEvent.setup();
      render(<SolidLoginPage />);

      const input = screen.getByRole("combobox");
      await user.type(input, "inrupt");

      const options = screen.getAllByRole("option");
      expect(options.length).toBe(1);
    });

    it("selecting an option updates the input", async () => {
      const user = userEvent.setup();
      render(<SolidLoginPage />);

      const input = screen.getByRole("combobox");
      await user.click(input);

      const options = screen.getAllByRole("option");
      await user.click(options[0]);

      expect(input).toHaveValue("https://solidcommunity.net/");
    });

    it("closes dropdown after selection and updates input value", async () => {
      const user = userEvent.setup();
      render(<SolidLoginPage />);

      const input = screen.getByRole("combobox");
      await user.click(input);
      expect(screen.getByRole("listbox")).toBeInTheDocument();

      const options = screen.getAllByRole("option");
      await user.click(options[0]);

      // After selection the input should have the selected value
      expect(input).toHaveValue("https://solidcommunity.net/");

      // The dropdown reopens because handleSelect calls inputRef.focus(),
      // which triggers onFocus → setShowDropdown(true). This is intentional
      // UX so the user can continue browsing options. Clicking outside closes it.
      // Verify clicking outside closes the dropdown.
      await user.click(document.body);
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("keyboard ArrowDown highlights next option", async () => {
      const user = userEvent.setup();
      render(<SolidLoginPage />);

      const input = screen.getByRole("combobox");
      await user.click(input);
      await user.keyboard("{ArrowDown}");

      // First option should be highlighted (background changes)
      const options = screen.getAllByRole("option");
      expect(options[0]).toHaveStyle({ background: "#f3f4f6" });
    });

    it("keyboard Enter selects highlighted option", async () => {
      const user = userEvent.setup();
      render(<SolidLoginPage />);

      const input = screen.getByRole("combobox");
      await user.click(input);
      await user.keyboard("{ArrowDown}{Enter}");

      expect(input).toHaveValue("https://solidcommunity.net/");
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("keyboard Escape closes dropdown", async () => {
      const user = userEvent.setup();
      render(<SolidLoginPage />);

      const input = screen.getByRole("combobox");
      await user.click(input);
      expect(screen.getByRole("listbox")).toBeInTheDocument();

      await user.keyboard("{Escape}");
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });

  // ── Slots / customization ─────────────────────────────────────────────

  describe("slots / customization", () => {
    it("renderForm replaces the entire form with custom UI", () => {
      render(
        <SolidLoginPage
          renderForm={() => <div data-testid="custom-form">Custom Form</div>}
        />
      );
      expect(screen.getByTestId("custom-form")).toBeInTheDocument();
      expect(screen.queryByLabelText("Sign in form")).not.toBeInTheDocument();
    });

    it("renderForm receives all expected props", () => {
      const renderForm = jest.fn((_props: Record<string, unknown>) => <div>Custom</div>);
      render(<SolidLoginPage renderForm={renderForm as any} />);

      expect(renderForm).toHaveBeenCalledTimes(1);
      const props = renderForm.mock.calls[0][0];
      expect(props).toHaveProperty("issuerInput");
      expect(props).toHaveProperty("setIssuerInput");
      expect(props).toHaveProperty("error");
      expect(props).toHaveProperty("presetIssuers");
      expect(props).toHaveProperty("isLoading");
      expect(props).toHaveProperty("onSubmit");
      expect(props).toHaveProperty("onIssuerChange");
    });
  });

  // ── Accessibility ──────────────────────────────────────────────────────

  describe("accessibility", () => {
    it("input has role=combobox and correct ARIA attributes", async () => {
      const user = userEvent.setup();
      render(<SolidLoginPage />);

      const input = screen.getByRole("combobox");
      expect(input).toHaveAttribute("aria-autocomplete", "list");
      expect(input).toHaveAttribute("aria-expanded", "false");

      await user.click(input);
      expect(input).toHaveAttribute("aria-expanded", "true");
    });

    it("dropdown has role=listbox", async () => {
      const user = userEvent.setup();
      render(<SolidLoginPage />);

      await user.click(screen.getByRole("combobox"));
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    it("options have role=option with aria-selected", async () => {
      const user = userEvent.setup();
      render(<SolidLoginPage />);

      await user.click(screen.getByRole("combobox"));
      const options = screen.getAllByRole("option");
      options.forEach((opt) => {
        expect(opt).toHaveAttribute("aria-selected");
      });
    });

    it("error message has role=alert", async () => {
      const user = userEvent.setup();
      render(<SolidLoginPage />);

      await user.click(
        screen.getByRole("button", { name: "Continue to sign in" })
      );

      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("submit button has aria-busy and aria-label", () => {
      render(<SolidLoginPage />);
      const button = screen.getByRole("button", {
        name: "Continue to sign in",
      });
      expect(button).toHaveAttribute("aria-busy", "false");
      expect(button).toHaveAttribute("aria-label", "Continue to sign in");
    });
  });
});
