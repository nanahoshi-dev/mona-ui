import { Signal } from "@angular/core";

export type VariantInputs<T> = {
    [K in keyof T]-?: Signal<T[K]>;
};
