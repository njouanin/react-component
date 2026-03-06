import { b as SolidLoginNavigation, S as SolidLoginConfig } from '../navigation-CCMzXY2v.cjs';
export { A as AuthGuard, D as DEFAULT_CONFIG, P as PresetIssuer, a as SolidLoginPage, c as SolidLoginPageProps, u as useSolidLogin, v as validateIssuerUrl } from '../navigation-CCMzXY2v.cjs';
import * as react_jsx_runtime from 'react/jsx-runtime';
import { ReactNode } from 'react';
import '@inrupt/solid-client-authn-core';

interface LoginFormControlProps {
    children: (props: {
        issuerInput: string;
        setIssuerInput: (v: string) => void;
        isLoading: boolean;
        error: string | null;
        presetIssuers: {
            label: string;
            value: string;
            secondaryLabel?: string;
        }[];
        onSubmit: (e: React.FormEvent) => void;
        onIssuerChange: (v: string) => void;
    }) => ReactNode;
    defaultIssuer?: string;
    presetIssuers?: {
        label: string;
        value: string;
        secondaryLabel?: string;
    }[];
}
declare function LoginFormControl({ children, defaultIssuer, presetIssuers, }: LoginFormControlProps): react_jsx_runtime.JSX.Element | null;

type NavigationContextValue = {
    navigation: SolidLoginNavigation;
    config: SolidLoginConfig;
} | null;
declare function SolidLoginNavigationProvider({ navigation, config, children, }: {
    navigation: SolidLoginNavigation;
    config?: Partial<SolidLoginConfig>;
    children: ReactNode;
}): react_jsx_runtime.JSX.Element;
declare function useSolidLoginNavigation(): NavigationContextValue;

export { LoginFormControl, SolidLoginConfig, SolidLoginNavigation, SolidLoginNavigationProvider, useSolidLoginNavigation };
