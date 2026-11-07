import { isPlatformBrowser } from "@angular/common";
import type { ThemePreference } from "../models/Theme";
import type { ThemeStorage } from "../models/ThemeStorage";

/**
 * The default `ThemeStorage`: `localStorage`, as JSON, under the `persistKey`.
 *
 * Reads report `null` anywhere `localStorage` can't answer, and writes are dropped there. That covers the
 * server, a browser that refuses it, and a full quota. `ThemeService` checks what comes back, so a value that
 * isn't a preference, or names a theme that's gone, counts as nothing stored.
 *
 * A server-rendered application gets `initialTheme` in its markup and the remembered theme on hydration, which
 * shows as a flash. Storage that the server can read too, such as a cookie, avoids it; supply it through
 * `provideThemeStorage()`.
 */
export class LocalStorageThemeStorage implements ThemeStorage {
    readonly #browser: boolean;

    /** Takes the value of `PLATFORM_ID`, which is a string in practice though typed loosely. */
    public constructor(platformId: string | object) {
        this.#browser = isPlatformBrowser(platformId);
    }

    public read(key: string): ThemePreference | null {
        if (!this.#browser) {
            return null;
        }
        try {
            const stored = localStorage.getItem(key);
            return stored === null ? null : (JSON.parse(stored) as ThemePreference);
        } catch {
            return null;
        }
    }

    public write(key: string, preference: ThemePreference): void {
        if (!this.#browser) {
            return;
        }
        try {
            localStorage.setItem(key, JSON.stringify(preference));
        } catch {
            // Nothing to recover: the theme still applies, it just won't be remembered.
        }
    }
}
