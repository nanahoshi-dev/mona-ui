import { inject, InjectionToken, PLATFORM_ID } from "@angular/core";
import type { SidebarStorage } from "../models/SidebarStorage";
import { LocalStorageSidebarStorage } from "../strategies/local-storage-sidebar.strategy";

/**
 * Where sidebars given a `persistKey` remember whether they were left open. Defaults to
 * `localStorage`. Replace it with `provideSidebarStorage()` — with something the server can read too,
 * for an application that renders there.
 */
export const SIDEBAR_STORAGE = new InjectionToken<SidebarStorage>("Mona UI sidebar storage", {
    providedIn: "root",
    factory: () => new LocalStorageSidebarStorage(inject(PLATFORM_ID))
});
