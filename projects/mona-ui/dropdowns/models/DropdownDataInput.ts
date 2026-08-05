import { InjectionToken, InputSignal } from "@angular/core";
import { DropdownFieldPredicateType, DropdownFieldSelectorType } from "./DropdownFieldTypes";

export interface DropdownDataInput<TData> {
    readonly data: InputSignal<Iterable<TData>>;
    readonly itemDisabled: InputSignal<DropdownFieldPredicateType<TData>>;
    readonly textField: InputSignal<DropdownFieldSelectorType<TData, string>>;
    readonly valueField: InputSignal<DropdownFieldSelectorType<TData, unknown>>;
}

export const DropdownDataInputToken = new InjectionToken<DropdownDataInput<unknown>>("DROPDOWN_DATA_INPUT");
