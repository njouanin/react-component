"use client";

import { ReactNode } from "react";
import { useSolidLogin } from "./useSolidLogin";

export interface LoginFormControlProps {
  children: (props: {
    issuerInput: string;
    setIssuerInput: (v: string) => void;
    isLoading: boolean;
    error: string | null;
    presetIssuers: { label: string; value: string; secondaryLabel?: string }[];
    onSubmit: (e: React.FormEvent) => void;
    onIssuerChange: (v: string) => void;
  }) => ReactNode;
  defaultIssuer?: string;
  presetIssuers?: { label: string; value: string; secondaryLabel?: string }[];
}

export function LoginFormControl({
  children,
  defaultIssuer,
  presetIssuers,
}: LoginFormControlProps) {
  const {
    session,
    issuerInput,
    setIssuerInput,
    isLoading,
    error,
    presetIssuers: presets,
    validateAndSubmit,
  } = useSolidLogin({ defaultIssuer, presetIssuers });

  if (session.isLoggedIn) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateAndSubmit();
  };

  return (
    <>
      {children({
        issuerInput,
        setIssuerInput,
        isLoading,
        error,
        presetIssuers: presets,
        onSubmit: handleSubmit,
        onIssuerChange: setIssuerInput,
      })}
    </>
  );
}
