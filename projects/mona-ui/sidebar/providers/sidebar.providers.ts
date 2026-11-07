import { makeEnvironmentProviders, type EnvironmentProviders } from "@angular/core";
import type { SidebarStorage } from "../models/SidebarStorage";
import { SIDEBAR_STORAGE } from "../tokens/sidebar.tokens";

/**
 * Replaces where sidebars remember whether they were left open. The default is `localStorage`, which
 * the server cannot read; supply a cookie- or request-backed storage here to have a server-rendered
 * application render the remembered state rather than correcting it on hydration.
 * @param storage the storage, or a factory for it that runs in an injection context, such as for one
 * that injects the current request
 */
export function provideSidebarStorage(storage: SidebarStorage | (() => SidebarStorage)): EnvironmentProviders {
    return makeEnvironmentProviders([
        typeof storage === "function"
            ? { provide: SIDEBAR_STORAGE, useFactory: storage }
            : { provide: SIDEBAR_STORAGE, useValue: storage }
    ]);
}
