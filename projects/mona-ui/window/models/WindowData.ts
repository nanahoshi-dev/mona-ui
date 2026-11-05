import { InjectionToken } from "@angular/core";

/**
 * The `data` a window was opened with, for a component given as its `content`.
 * @example
 * ```ts
 * readonly #data = inject<{ name: string }>(WINDOW_DATA);
 * ```
 */
export const WINDOW_DATA = new InjectionToken<unknown>("WINDOW_DATA");
