import { InjectionToken, type InputSignal } from "@angular/core";
import type { DropdownFieldPredicateType, DropdownFieldSelectorType } from "./DropdownFieldTypes";

export interface DropdownDataInput<TData> {
    readonly data: InputSignal<Iterable<TData>>;
    readonly itemDisabled: InputSignal<DropdownFieldPredicateType<TData>>;
    readonly textField: InputSignal<DropdownFieldSelectorType<TData, string>>;
    readonly valueField: InputSignal<DropdownFieldSelectorType<TData, unknown>>;
}

export const DROPDOWN_DATA_INPUT_TOKEN = new InjectionToken<DropdownDataInput<unknown>>("DROPDOWN_DATA_INPUT");

/**
 * @deprecated Use {@link DROPDOWN_DATA_INPUT_TOKEN}.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention -- kept so existing imports keep working
export const DropdownDataInputToken = DROPDOWN_DATA_INPUT_TOKEN;
