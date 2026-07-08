import { InjectionToken, InputSignal } from "@angular/core";
import { DropdownFieldPredicateType, DropdownFieldSelectorType } from "./DropdownFieldTypes";

export interface DropdownDataInput<TData> {
    readonly data: InputSignal<Iterable<TData>>;
    readonly itemDisabled: InputSignal<DropdownFieldPredicateType<TData>>;
    readonly textField: InputSignal<DropdownFieldSelectorType<TData>>;
    readonly valueField: InputSignal<DropdownFieldSelectorType<TData>>;
}

export const DropdownDataInputToken = new InjectionToken<DropdownDataInput<unknown>>("DROPDOWN_DATA_INPUT");
