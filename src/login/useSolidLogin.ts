"use client";

import { useState, useCallback } from "react";
import { useSolidAuth } from "@ldo/solid-react";

export interface PresetIssuer {
  label: string;
  value: string;
  secondaryLabel?: string;
}

const DEFAULT_PRESETS: PresetIssuer[] = [
  { label: "Solid Community", value: "https://solidcommunity.net/", secondaryLabel: "https://solidcommunity.net/" },
  { label: "Inrupt", value: "https://login.inrupt.com", secondaryLabel: "https://login.inrupt.com" },
];

export function validateIssuerUrl(url: string): { valid: boolean; error: string | null } {
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

export interface UseSolidLoginOptions {
  defaultIssuer?: string;
  presetIssuers?: PresetIssuer[];
  onAlreadyLoggedIn?: () => void;
}

export function useSolidLogin(options: UseSolidLoginOptions = {}) {
  const { session, login } = useSolidAuth();
  const [issuerInput, setIssuerInput] = useState(options.defaultIssuer ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presetIssuers = options.presetIssuers ?? DEFAULT_PRESETS;

  const validateAndSubmit = useCallback(async (): Promise<boolean> => {
    const trimmed = issuerInput.trim();
    const { valid, error: err } = validateIssuerUrl(trimmed);
    if (!valid) {
      setError(err);
      return false;
    }
    setError(null);
    setIsLoading(true);
    try {
      await login(trimmed);
      return true;
    } catch (e) {
      console.error("Login failed:", e);
      setIsLoading(false);
      return false;
    }
  }, [issuerInput, login]);

  const setIssuer = useCallback((value: string) => {
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
    login,
  };
}
