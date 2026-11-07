import { InjectionToken } from "@angular/core";
import type { Signal } from "@angular/core";

export interface RadioGroupContext {
    readonly disabled: Signal<boolean>;
    readonly invalid: Signal<boolean>;
    readonly name: Signal<string>;
    readonly readonly: Signal<boolean>;
    readonly required: Signal<boolean>;
    readonly select: (value: unknown) => void;
    /** Changes after every selection, so radios can re-check the native state even when `value` was set back. */
    readonly selectionVersion: Signal<number>;
    readonly value: Signal<unknown>;
}

/**
 * Provided by `mona-radio-group` to the radio buttons inside it.
 */
export const MONA_RADIO_GROUP = new InjectionToken<RadioGroupContext>("MONA_RADIO_GROUP");
