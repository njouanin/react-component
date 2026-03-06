import * as react_jsx_runtime from 'react/jsx-runtime';
import { ReactNode } from 'react';
import { S as SolidLoginConfig } from '../navigation-CCMzXY2v.js';
export { A as AuthGuard, a as SolidLoginPage } from '../navigation-CCMzXY2v.js';
import '@inrupt/solid-client-authn-core';

/**
 * Next.js adapter: provides navigation from next/navigation so AuthGuard works without manual setup.
 * Must be used inside <Suspense> because it uses useSearchParams().
 */
declare function SolidLoginNavigationProviderNext({ config, children, }: {
    config?: Partial<SolidLoginConfig>;
    children: ReactNode;
}): react_jsx_runtime.JSX.Element;

export { SolidLoginNavigationProviderNext };
