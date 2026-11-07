import type { ThemePreference } from "./Theme";

/**
 * Where the theme is remembered. Supplied through `THEME_STORAGE`, and only ever consulted when
 * `provideThemeOptions()` was given a `persistKey`.
 */
export interface ThemeStorage {
    /**
     * The remembered preference for `key`, or `null` when nothing has been stored under it, including when this
     * storage can't answer, such as on the server. A `null` leaves the theme on `initialTheme`.
     */
    read(key: string): ThemePreference | null;

    /** Records the preference for `key`. Failing to store it must not throw. */
    write(key: string, preference: ThemePreference): void;
}
