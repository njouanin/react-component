"use client";

// src/login/AuthGuard.tsx
import { useEffect, useRef, Suspense } from "react";
import { useSolidAuth } from "@ldo/solid-react";

// src/login/NavigationContext.tsx
import { createContext, useContext } from "react";
import { jsx } from "react/jsx-runtime";
var SolidLoginNavigationContext = createContext(null);
function SolidLoginNavigationProvider({
  navigation,
  config,
  children
}) {
  const fullConfig = {
    loginPath: config?.loginPath ?? "/login",
    homePath: config?.homePath ?? "/"
  };
  return /* @__PURE__ */ jsx(SolidLoginNavigationContext.Provider, { value: { navigation, config: fullConfig }, children });
}
function useSolidLoginNavigation() {
  return useContext(SolidLoginNavigationContext);
}

// src/login/AuthGuard.tsx
import { Fragment, jsx as jsx2 } from "react/jsx-runtime";
var RETURN_TO_KEY = "solid-login-returnTo";
function storageGet(storage, key) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}
function storageSet(storage, key, value) {
  try {
    storage.setItem(key, value);
  } catch {
  }
}
function storageRemove(storage, key) {
  try {
    storage.removeItem(key);
  } catch {
  }
}
function isValidReturnPath(value) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//");
}
function resolveReturnTo(searchParams, loginPath, homePath) {
  const fromParam = searchParams.get("returnTo");
  if (isValidReturnPath(fromParam)) return fromParam;
  if (typeof window === "undefined") return homePath;
  const fromStorage = storageGet(sessionStorage, RETURN_TO_KEY);
  if (isValidReturnPath(fromStorage)) return fromStorage;
  const browserPath = window.location.pathname;
  if (browserPath !== loginPath && browserPath !== homePath && isValidReturnPath(browserPath)) {
    return browserPath;
  }
  return homePath;
}
var defaultFallback = /* @__PURE__ */ jsx2(
  "div",
  {
    style: {
      display: "flex",
      minHeight: "100vh",
      alignItems: "center",
      justifyContent: "center",
      background: "#fff"
    },
    children: /* @__PURE__ */ jsx2("span", { children: "Loading..." })
  }
);
function AuthGuardContent({
  children,
  fallback = defaultFallback
}) {
  const { session, ranInitialAuthCheck = true } = useSolidAuth();
  const nav = useSolidLoginNavigation();
  const pathname = nav?.navigation.getPathname() ?? "/";
  const searchParams = nav?.navigation.getSearchParams() ?? { has: () => false, get: () => null };
  const config = nav?.config ?? { loginPath: "/login", homePath: "/" };
  const isOAuthCallback = searchParams.has("code") || searchParams.has("state");
  const isLoginPage = pathname === config.loginPath;
  const hasRedirectedRef = useRef(false);
  const prevPathnameRef = useRef(pathname);
  if (prevPathnameRef.current !== pathname) {
    prevPathnameRef.current = pathname;
    hasRedirectedRef.current = false;
  }
  useEffect(() => {
    if (typeof window === "undefined" || !isLoginPage || session.isLoggedIn) return;
    const returnTo = searchParams.get("returnTo");
    if (isValidReturnPath(returnTo)) {
      storageSet(sessionStorage, RETURN_TO_KEY, returnTo);
    }
  }, [isLoginPage, session.isLoggedIn]);
  useEffect(() => {
    if (!nav || !ranInitialAuthCheck || hasRedirectedRef.current) return;
    const { navigation } = nav;
    const sp = navigation.getSearchParams();
    const path = navigation.getPathname();
    const isCallback = sp.has("code") || sp.has("state");
    const isLogin = path === config.loginPath;
    if (isCallback && session.isLoggedIn) {
      hasRedirectedRef.current = true;
      let target = resolveReturnTo(sp, config.loginPath, config.homePath);
      if (target === config.loginPath) target = config.homePath;
      storageRemove(sessionStorage, RETURN_TO_KEY);
      navigation.redirect(target);
      return;
    }
    if (session.isLoggedIn && isLogin && !isCallback) {
      hasRedirectedRef.current = true;
      let target = resolveReturnTo(sp, config.loginPath, config.homePath);
      if (target === config.loginPath) target = config.homePath;
      storageRemove(sessionStorage, RETURN_TO_KEY);
      navigation.replace(target);
      return;
    }
    if (!session.isLoggedIn && !isLogin && !isCallback) {
      hasRedirectedRef.current = true;
      const current = path || "/";
      if (current !== config.loginPath && current !== config.homePath) {
        storageSet(sessionStorage, RETURN_TO_KEY, current);
      }
      const loginUrl = current === config.loginPath || current === config.homePath ? config.loginPath : `${config.loginPath}?returnTo=${encodeURIComponent(current)}`;
      navigation.replace(loginUrl);
    }
  }, [ranInitialAuthCheck, session.isLoggedIn, pathname, nav, config.loginPath, config.homePath]);
  if (!nav) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "solid-react-component: AuthGuard requires SolidLoginNavigationProvider (or use 'solid-react-component/login/next')"
      );
    }
    return /* @__PURE__ */ jsx2(Fragment, { children });
  }
  if (!ranInitialAuthCheck) return /* @__PURE__ */ jsx2(Fragment, { children: fallback });
  if (isOAuthCallback) return /* @__PURE__ */ jsx2(Fragment, { children: fallback });
  if (!session.isLoggedIn && !isLoginPage) return null;
  if (session.isLoggedIn && isLoginPage) return null;
  return /* @__PURE__ */ jsx2(Fragment, { children });
}
function AuthGuard(props) {
  return /* @__PURE__ */ jsx2(Suspense, { fallback: props.fallback ?? defaultFallback, children: /* @__PURE__ */ jsx2(AuthGuardContent, { ...props }) });
}

// src/login/SolidLoginPage.tsx
import {
  useState as useState2,
  useEffect as useEffect2,
  useRef as useRef2,
  useMemo,
  useId
} from "react";

// src/login/useSolidLogin.ts
import { useState, useCallback } from "react";
import { useSolidAuth as useSolidAuth2 } from "@ldo/solid-react";
var DEFAULT_PRESETS = [
  { label: "Solid Community", value: "https://solidcommunity.net/", secondaryLabel: "https://solidcommunity.net/" },
  { label: "Inrupt", value: "https://login.inrupt.com", secondaryLabel: "https://login.inrupt.com" }
];
function validateIssuerUrl(url) {
  if (!url.trim()) return { valid: false, error: "Please enter a Solid Identity Provider URL" };
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { valid: false, error: "URL must start with http:// or https://" };
    }
  } catch {
    return { valid: false, error: "Please enter a valid URL" };
  }
  return { valid: true, error: null };
}
function useSolidLogin(options = {}) {
  const { session, login } = useSolidAuth2();
  const [issuerInput, setIssuerInput] = useState(options.defaultIssuer ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const presetIssuers = options.presetIssuers ?? DEFAULT_PRESETS;
  const validateAndSubmit = useCallback(async () => {
    const trimmed = issuerInput.trim();
    const { valid, error: err } = validateIssuerUrl(trimmed);
    if (!valid) {
      setError(err);
      return false;
    }
    setError(null);
    setIsLoading(true);
    try {
      await login(trimmed, options.redirectUrl ? { redirectUrl: options.redirectUrl } : void 0);
      return true;
    } catch (e) {
      console.error("Login failed:", e);
      setIsLoading(false);
      return false;
    }
  }, [issuerInput, login, options.redirectUrl]);
  const setIssuer = useCallback((value) => {
    setIssuerInput(value);
    setError(null);
  }, []);
  return {
    session,
    issuerInput,
    setIssuerInput: setIssuer,
    isLoading,
    error,
    presetIssuers,
    validateAndSubmit,
    login
  };
}

// src/login/SolidLoginPage.tsx
import { Fragment as Fragment2, jsx as jsx3, jsxs } from "react/jsx-runtime";
var defaultTitle = "Sign in";
var defaultSubtitle = "to continue";
function ChevronDownIcon({
  open,
  style
}) {
  return /* @__PURE__ */ jsx3(
    "svg",
    {
      width: "20",
      height: "20",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      style: {
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 0.2s",
        ...style
      },
      "aria-hidden": true,
      children: /* @__PURE__ */ jsx3("path", { d: "m6 9 6 6 6-6" })
    }
  );
}
function GitHubIcon({ style }) {
  return /* @__PURE__ */ jsx3(
    "svg",
    {
      width: "16",
      height: "16",
      fill: "currentColor",
      viewBox: "0 0 24 24",
      "aria-hidden": true,
      style,
      children: /* @__PURE__ */ jsx3(
        "path",
        {
          fillRule: "evenodd",
          d: "M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z",
          clipRule: "evenodd"
        }
      )
    }
  );
}
function ReportIssueIcon({ style }) {
  return /* @__PURE__ */ jsx3(
    "svg",
    {
      width: "16",
      height: "16",
      fill: "none",
      stroke: "currentColor",
      viewBox: "0 0 24 24",
      "aria-hidden": true,
      style,
      children: /* @__PURE__ */ jsx3(
        "path",
        {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeWidth: 2,
          d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        }
      )
    }
  );
}
function ButtonSpinner() {
  return /* @__PURE__ */ jsx3(
    "span",
    {
      style: {
        display: "inline-block",
        width: 14,
        height: 14,
        border: "2px solid transparent",
        borderTopColor: "currentColor",
        borderRadius: "50%",
        animation: "solid-login-spin 0.6s linear infinite",
        marginRight: 8,
        verticalAlign: "middle"
      }
    }
  );
}
function SolidLoginPage({
  onAlreadyLoggedIn,
  redirectUrl,
  defaultIssuer,
  presetIssuers,
  logo,
  logoAlt = "Logo",
  title = defaultTitle,
  subtitle = defaultSubtitle,
  inputPlaceholder = "Enter your provider URL or select from the list",
  inputLabel = "Solid Identity Provider",
  buttonLabel = "Next",
  buttonLoadingLabel = "Signing in...",
  className = "",
  footerGitHubUrl,
  footerIssuesUrl,
  renderLogo,
  renderForm,
  renderFooter
}) {
  const {
    session,
    issuerInput,
    setIssuerInput,
    isLoading,
    error,
    presetIssuers: presets,
    validateAndSubmit
  } = useSolidLogin({ defaultIssuer, presetIssuers, redirectUrl });
  const [showDropdown, setShowDropdown] = useState2(false);
  const [highlightedIndex, setHighlightedIndex] = useState2(-1);
  const inputRef = useRef2(null);
  const dropdownRef = useRef2(null);
  const generatedId = useId();
  const inputId = `solid-login-combobox-${generatedId}`;
  const listboxId = `${inputId}-listbox`;
  useEffect2(() => {
    if (session.isLoggedIn && onAlreadyLoggedIn) onAlreadyLoggedIn();
  }, [session.isLoggedIn, onAlreadyLoggedIn]);
  useEffect2(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) && inputRef.current && !inputRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);
  const filteredOptions = useMemo(() => {
    if (!issuerInput.trim()) return presets;
    const q = issuerInput.toLowerCase();
    return presets.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q) || o.secondaryLabel && o.secondaryLabel.toLowerCase().includes(q)
    );
  }, [issuerInput, presets]);
  if (session.isLoggedIn) return null;
  const handleSubmit = (e) => {
    e.preventDefault();
    validateAndSubmit();
  };
  const handleSelect = (option) => {
    setIssuerInput(option.value);
    setShowDropdown(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };
  const handleKeyDown = (e) => {
    if (!showDropdown) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setShowDropdown(true);
        setHighlightedIndex(-1);
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex(
          (prev) => prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => prev > 0 ? prev - 1 : prev);
        break;
      case "Enter":
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          e.preventDefault();
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowDropdown(false);
        setHighlightedIndex(-1);
        break;
    }
  };
  const formProps = {
    issuerInput,
    setIssuerInput,
    error,
    presetIssuers: presets,
    isLoading,
    onSubmit: handleSubmit,
    onIssuerChange: setIssuerInput
  };
  if (renderForm) {
    return /* @__PURE__ */ jsx3(
      "main",
      {
        className,
        role: "main",
        "aria-label": "Sign in page",
        style: { display: "flex", minHeight: "100vh", background: "#fff" },
        children: renderForm(formProps)
      }
    );
  }
  const showFooter = renderFooter || footerGitHubUrl != null && footerIssuesUrl != null;
  return /* @__PURE__ */ jsxs(Fragment2, { children: [
    /* @__PURE__ */ jsx3("style", { children: `
        @keyframes solid-login-spin {
          to { transform: rotate(360deg); }
        }
        .solid-login-combobox-input:focus {
          border-color: #7B42F6;
          box-shadow: 0 0 0 1px #7B42F6;
        }
        @media (max-width: 1023px) {
          .solid-login-left-panel { display: none !important; }
          .solid-login-mobile-header { display: flex !important; }
        }
        @media (min-width: 1024px) {
          .solid-login-mobile-header { display: none !important; }
        }
        @media (min-width: 1024px) {
          .solid-login-right-panel { min-width: 450px; }
        }
      ` }),
    /* @__PURE__ */ jsxs(
      "main",
      {
        className,
        role: "main",
        "aria-label": "Sign in page",
        style: {
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          minHeight: "100vh",
          background: "#fff"
        },
        children: [
          /* @__PURE__ */ jsx3(
            "section",
            {
              className: "solid-login-left-panel",
              "aria-label": "Branding section",
              style: {
                display: "flex",
                flex: "1 1 50%",
                minWidth: 280,
                alignItems: "center",
                justifyContent: "center",
                borderRight: "1px solid #e5e7eb",
                background: "#F3EDFF",
                padding: "2rem"
              },
              children: /* @__PURE__ */ jsx3("div", { style: { maxWidth: "28rem", width: "100%" }, children: /* @__PURE__ */ jsxs(
                "header",
                {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4
                  },
                  children: [
                    renderLogo ? renderLogo() : logo ? /* @__PURE__ */ jsx3(
                      "div",
                      {
                        style: {
                          width: 300,
                          height: 90,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        },
                        children: /* @__PURE__ */ jsx3(
                          "img",
                          {
                            src: logo,
                            alt: logoAlt,
                            style: { width: "100%", height: "100%", objectFit: "contain" }
                          }
                        )
                      }
                    ) : null,
                    /* @__PURE__ */ jsx3(
                      "h1",
                      {
                        style: {
                          marginBottom: 2,
                          fontSize: "2.25rem",
                          fontWeight: 400,
                          color: "#000"
                        },
                        children: title
                      }
                    ),
                    /* @__PURE__ */ jsx3("p", { style: { fontSize: "1rem", color: "#4b5563" }, children: subtitle })
                  ]
                }
              ) })
            }
          ),
          /* @__PURE__ */ jsx3(
            "section",
            {
              className: "solid-login-right-panel",
              "aria-label": "Sign in form section",
              style: {
                display: "flex",
                flex: "1 1 50%",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "#fff",
                padding: "3rem 1rem",
                minWidth: 0,
                minHeight: 320
              },
              children: /* @__PURE__ */ jsxs("div", { style: { width: "100%", maxWidth: "28rem" }, children: [
                /* @__PURE__ */ jsxs(
                  "header",
                  {
                    className: "solid-login-mobile-header",
                    style: {
                      display: "none",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "2rem"
                    },
                    children: [
                      renderLogo ? renderLogo() : logo ? /* @__PURE__ */ jsx3(
                        "div",
                        {
                          style: {
                            width: 300,
                            height: 90,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 8
                          },
                          children: /* @__PURE__ */ jsx3(
                            "img",
                            {
                              src: logo,
                              alt: logoAlt,
                              style: { width: "100%", height: "100%", objectFit: "contain" }
                            }
                          )
                        }
                      ) : null,
                      /* @__PURE__ */ jsx3(
                        "h1",
                        {
                          style: {
                            marginBottom: 8,
                            fontSize: "1.875rem",
                            fontWeight: 400,
                            color: "#000",
                            textAlign: "center"
                          },
                          children: title
                        }
                      ),
                      /* @__PURE__ */ jsx3("p", { style: { fontSize: "1rem", color: "#4b5563", textAlign: "center" }, children: subtitle })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "form",
                  {
                    onSubmit: handleSubmit,
                    "aria-label": "Sign in form",
                    noValidate: true,
                    style: { display: "flex", flexDirection: "column", gap: "1.5rem" },
                    children: [
                      /* @__PURE__ */ jsx3(
                        "label",
                        {
                          htmlFor: inputId,
                          style: {
                            display: "block",
                            marginBottom: 8,
                            fontSize: "0.875rem",
                            fontWeight: 500,
                            color: "#000"
                          },
                          children: inputLabel
                        }
                      ),
                      /* @__PURE__ */ jsxs("div", { style: { position: "relative" }, children: [
                        /* @__PURE__ */ jsx3(
                          "input",
                          {
                            ref: inputRef,
                            id: inputId,
                            type: "text",
                            value: issuerInput,
                            onChange: (e) => setIssuerInput(e.target.value),
                            onFocus: () => {
                              setShowDropdown(true);
                              setHighlightedIndex(-1);
                            },
                            onKeyDown: handleKeyDown,
                            placeholder: inputPlaceholder,
                            disabled: isLoading,
                            "aria-invalid": !!error,
                            "aria-expanded": showDropdown,
                            "aria-controls": listboxId,
                            "aria-autocomplete": "list",
                            "aria-activedescendant": highlightedIndex >= 0 ? `${inputId}-option-${highlightedIndex}` : void 0,
                            role: "combobox",
                            autoComplete: "off",
                            className: "solid-login-combobox-input",
                            style: {
                              width: "100%",
                              height: 48,
                              paddingLeft: 16,
                              paddingRight: 40,
                              fontSize: "1rem",
                              color: "#000",
                              background: "#fff",
                              border: `1px solid ${error ? "#fca5a5" : "#d1d5db"}`,
                              borderRadius: 6,
                              outline: "none",
                              boxSizing: "border-box"
                            },
                            onBlur: () => {
                            }
                          }
                        ),
                        /* @__PURE__ */ jsx3(
                          "button",
                          {
                            type: "button",
                            onClick: () => {
                              setShowDropdown(!showDropdown);
                              inputRef.current?.focus();
                            },
                            "aria-label": showDropdown ? "Hide options" : "Show options",
                            "aria-expanded": showDropdown,
                            tabIndex: -1,
                            style: {
                              position: "absolute",
                              right: 12,
                              top: "50%",
                              transform: "translateY(-50%)",
                              padding: 0,
                              border: "none",
                              background: "none",
                              cursor: "pointer",
                              color: "#9ca3af"
                            },
                            children: /* @__PURE__ */ jsx3(ChevronDownIcon, { open: showDropdown })
                          }
                        ),
                        showDropdown && filteredOptions.length > 0 && /* @__PURE__ */ jsx3(
                          "div",
                          {
                            ref: dropdownRef,
                            id: listboxId,
                            role: "listbox",
                            "aria-label": "Options",
                            style: {
                              position: "absolute",
                              zIndex: 10,
                              marginTop: 4,
                              width: "100%",
                              maxHeight: 240,
                              overflow: "auto",
                              border: "1px solid #e5e7eb",
                              borderRadius: 6,
                              background: "#fff",
                              boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)"
                            },
                            children: filteredOptions.map((option, index) => /* @__PURE__ */ jsxs(
                              "button",
                              {
                                id: `${inputId}-option-${index}`,
                                type: "button",
                                role: "option",
                                "aria-selected": issuerInput === option.value,
                                onClick: () => handleSelect(option),
                                onMouseEnter: () => setHighlightedIndex(index),
                                style: {
                                  width: "100%",
                                  padding: "12px 16px",
                                  textAlign: "left",
                                  border: "none",
                                  background: highlightedIndex === index ? "#f3f4f6" : "transparent",
                                  cursor: "pointer",
                                  fontSize: "0.875rem",
                                  color: "#111"
                                },
                                children: [
                                  /* @__PURE__ */ jsx3("div", { style: { fontWeight: 500, marginBottom: 2 }, children: option.label }),
                                  option.secondaryLabel && /* @__PURE__ */ jsx3(
                                    "div",
                                    {
                                      style: {
                                        fontSize: "0.75rem",
                                        color: "#6b7280",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap"
                                      },
                                      children: option.secondaryLabel
                                    }
                                  )
                                ]
                              },
                              option.value
                            ))
                          }
                        )
                      ] }),
                      error && /* @__PURE__ */ jsx3(
                        "p",
                        {
                          role: "alert",
                          style: { fontSize: "0.75rem", color: "#dc2626", marginTop: 4 },
                          children: error
                        }
                      ),
                      /* @__PURE__ */ jsx3(
                        "div",
                        {
                          style: {
                            display: "flex",
                            justifyContent: "flex-end",
                            paddingTop: 16
                          },
                          children: /* @__PURE__ */ jsx3(
                            "button",
                            {
                              type: "submit",
                              disabled: isLoading,
                              "aria-busy": isLoading,
                              "aria-label": isLoading ? "Signing in, please wait" : "Continue to sign in",
                              style: {
                                padding: "8px 16px",
                                fontSize: "0.875rem",
                                fontWeight: 500,
                                color: "#fff",
                                background: isLoading ? "#d1d5db" : "#7B42F6",
                                border: "none",
                                borderRadius: 6,
                                cursor: isLoading ? "not-allowed" : "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "none"
                              },
                              children: isLoading ? /* @__PURE__ */ jsxs(Fragment2, { children: [
                                /* @__PURE__ */ jsx3(ButtonSpinner, {}),
                                buttonLoadingLabel
                              ] }) : buttonLabel
                            }
                          )
                        }
                      )
                    ]
                  }
                ),
                showFooter && /* @__PURE__ */ jsx3(
                  "footer",
                  {
                    className: "solid-login-footer-wrap",
                    style: {
                      marginTop: "6rem",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      width: "100%"
                    },
                    children: renderFooter ? renderFooter() : /* @__PURE__ */ jsxs(
                      "div",
                      {
                        style: {
                          display: "flex",
                          alignItems: "center",
                          gap: 16,
                          fontSize: "0.875rem",
                          color: "#6b7280"
                        },
                        children: [
                          /* @__PURE__ */ jsxs(
                            "a",
                            {
                              href: footerGitHubUrl,
                              target: "_blank",
                              rel: "noopener noreferrer",
                              style: {
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                color: "inherit",
                                textDecoration: "none"
                              },
                              "aria-label": "View source code on GitHub",
                              children: [
                                /* @__PURE__ */ jsx3(GitHubIcon, {}),
                                /* @__PURE__ */ jsx3("span", { children: "GitHub" })
                              ]
                            }
                          ),
                          /* @__PURE__ */ jsx3("span", { style: { color: "#d1d5db" }, children: "\xB7" }),
                          /* @__PURE__ */ jsxs(
                            "a",
                            {
                              href: footerIssuesUrl,
                              target: "_blank",
                              rel: "noopener noreferrer",
                              style: {
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                color: "inherit",
                                textDecoration: "none"
                              },
                              "aria-label": "Report an issue on GitHub",
                              children: [
                                /* @__PURE__ */ jsx3(ReportIssueIcon, {}),
                                /* @__PURE__ */ jsx3("span", { children: "Report an issue" })
                              ]
                            }
                          )
                        ]
                      }
                    )
                  }
                )
              ] })
            }
          )
        ]
      }
    )
  ] });
}

// src/login/LoginFormControl.tsx
import { Fragment as Fragment3, jsx as jsx4 } from "react/jsx-runtime";
function LoginFormControl({
  children,
  defaultIssuer,
  presetIssuers
}) {
  const {
    session,
    issuerInput,
    setIssuerInput,
    isLoading,
    error,
    presetIssuers: presets,
    validateAndSubmit
  } = useSolidLogin({ defaultIssuer, presetIssuers });
  if (session.isLoggedIn) return null;
  const handleSubmit = (e) => {
    e.preventDefault();
    validateAndSubmit();
  };
  return /* @__PURE__ */ jsx4(Fragment3, { children: children({
    issuerInput,
    setIssuerInput,
    isLoading,
    error,
    presetIssuers: presets,
    onSubmit: handleSubmit,
    onIssuerChange: setIssuerInput
  }) });
}

// src/login/navigation.ts
var DEFAULT_CONFIG = {
  loginPath: "/login",
  homePath: "/"
};
export {
  AuthGuard,
  DEFAULT_CONFIG,
  LoginFormControl,
  SolidLoginNavigationProvider,
  SolidLoginPage,
  useSolidLogin,
  useSolidLoginNavigation,
  validateIssuerUrl
};
//# sourceMappingURL=index.js.map