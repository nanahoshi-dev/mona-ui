import { DestroyRef, DOCUMENT, inject, type Signal, signal } from "@angular/core";

/** Screens narrower than this open a dropdown with `adaptiveMode="auto"` as a bottom sheet. */
const SMALL_SCREEN_QUERY = "(max-width: 639.98px)";

/**
 * Whether the screen is narrow enough for a dropdown with `adaptiveMode="auto"` to open as a bottom sheet, now.
 * @hidden Exported for Mona UI's other entry points; applications don't need it.
 */
export function matchesSmallScreen(document: Document): boolean {
    return document.defaultView?.matchMedia?.(SMALL_SCREEN_QUERY).matches ?? false;
}

/**
 * Whether the screen is narrow enough for a dropdown with `adaptiveMode="auto"` to open as a bottom sheet, kept up to
 * date as the window is resized. `false` on the server. Call it in an injection context.
 * @hidden Exported for Mona UI's other entry points; applications don't need it.
 */
export function injectSmallScreen(): Signal<boolean> {
    const query = inject(DOCUMENT).defaultView?.matchMedia?.(SMALL_SCREEN_QUERY);
    const matches = signal(query?.matches ?? false);
    if (query && typeof query.addEventListener === "function") {
        const onChange = (event: MediaQueryListEvent): void => matches.set(event.matches);
        query.addEventListener("change", onChange);
        inject(DestroyRef).onDestroy(() => query.removeEventListener("change", onChange));
    }
    return matches.asReadonly();
}
