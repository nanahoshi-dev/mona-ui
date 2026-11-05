import { computed, inject, InjectionToken, type Signal } from "@angular/core";

/**
 * Whether the enclosing `mona-fieldset` is disabled. A native `<fieldset disabled>` reaches only native controls,
 * so the fieldset also provides this for controls that draw their own focusable element.
 */
export const MONA_FIELDSET_DISABLED = new InjectionToken<Signal<boolean>>("MONA_FIELDSET_DISABLED");

/**
 * Combines a control's own `disabled` with the enclosing `mona-fieldset`. Call it from an injection context.
 *
 * @param disabled Reads the control's own disabled state. It runs lazily, so it may read an input declared later.
 */
export function injectEffectiveDisabled(disabled: () => boolean): Signal<boolean> {
    const fieldsetDisabled = inject(MONA_FIELDSET_DISABLED, { optional: true });
    return computed(() => disabled() || (fieldsetDisabled?.() ?? false));
}
