import { isPlatformBrowser } from "@angular/common";
import type { SidebarStorage } from "../models/SidebarStorage";

/**
 * The default `SidebarStorage`: `localStorage`, under the sidebar's `persistKey`.
 *
 * Reads report `null` anywhere `localStorage` cannot answer, and writes are dropped there. That
 * covers the server, where there is no such thing, and a browser that refuses it — Safari's private
 * mode throws on access rather than returning empty, and a full quota throws on write. None of that
 * is worth taking an application down over: the sidebar simply opens the way its input says.
 *
 * A server-rendered application gets the default state in its markup and the remembered one on
 * hydration, which shows as a flash. Storage that the server can read too — a cookie, or state
 * transferred from the request — avoids it; supply it through `provideSidebarStorage()`.
 */
export class LocalStorageSidebarStorage implements SidebarStorage {
    readonly #browser: boolean;

    /** Takes the value of `PLATFORM_ID`, which is a string in practice though typed loosely. */
    public constructor(platformId: string | object) {
        this.#browser = isPlatformBrowser(platformId);
    }

    public read(key: string): boolean | null {
        if (!this.#browser) {
            return null;
        }
        try {
            const stored = localStorage.getItem(key);
            return stored === null ? null : stored === "true";
        } catch {
            return null;
        }
    }

    public write(key: string, expanded: boolean): void {
        if (!this.#browser) {
            return;
        }
        try {
            localStorage.setItem(key, String(expanded));
        } catch {
            // Nothing to recover: the sidebar still works, it just will not be remembered.
        }
    }
}
