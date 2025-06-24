import { InputSignal, Signal } from "@angular/core";

export type VariantInputs<T> = {
    [K in keyof T]-?: Signal<T[K]>;
};

export type VariantPropsWithoutNull<T> = Required<{
    [K in keyof T]: Exclude<T[K], null | undefined>;
}>;
