import { InjectionToken } from "@angular/core";

/**
 * The `data` a dialog was opened with, for a component given as its `content`.
 * @example
 * ```ts
 * readonly #data = inject<{ name: string }>(DIALOG_DATA);
 * ```
 */
export const DIALOG_DATA = new InjectionToken<unknown>("DIALOG_DATA");
