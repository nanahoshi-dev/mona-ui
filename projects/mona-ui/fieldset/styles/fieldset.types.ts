import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type {
    fieldsetBaseVariants as monaFieldsetBaseVariants,
    fieldsetLegendVariants as monaFieldsetLegendVariants,
    fieldsetVariants as monaFieldsetVariants
} from "./fieldset.mona.styles";

export type FieldsetBaseVariantsFunction = (props?: FieldsetBaseVariantProps) => string;
export type FieldsetBaseVariantProps = VariantProps<typeof monaFieldsetBaseVariants>;

export type FieldsetFieldsetVariantsFunction = (props?: FieldsetFieldsetVariantProps) => string;
export type FieldsetFieldsetVariantProps = VariantProps<typeof monaFieldsetVariants>;

export type FieldsetLegendVariantsFunction = (props?: FieldsetLegendVariantProps) => string;
export type FieldsetLegendVariantProps = VariantProps<typeof monaFieldsetLegendVariants>;

export type FieldsetBaseVariantInput = VariantInputs<FieldsetBaseVariantProps>;
export type FieldsetFieldsetVariantInput = VariantInputs<FieldsetFieldsetVariantProps>;
export type FieldsetLegendVariantInput = VariantInputs<FieldsetLegendVariantProps>;

export type FieldsetVariantProps = FieldsetBaseVariantProps & FieldsetFieldsetVariantProps & FieldsetLegendVariantProps;
export type FieldsetVariantInput = FieldsetBaseVariantInput &
    FieldsetFieldsetVariantInput &
    Omit<FieldsetLegendVariantInput, "hasTemplate">;

export interface FieldsetVariantsFunctions {
    readonly base: FieldsetBaseVariantsFunction;
    readonly fieldset: FieldsetFieldsetVariantsFunction;
    readonly legend: FieldsetLegendVariantsFunction;
}

export type FieldsetStyleStrategy = ThemeStrategy<FieldsetVariantsFunctions>;

export interface FieldsetBaseStyleOverrides {
    readonly base?: ClassValue;
}

export interface FieldsetFieldsetCompoundStyleOverride {
    readonly when: Partial<FieldsetFieldsetVariantProps>;
    readonly class: ClassValue;
}

export interface FieldsetFieldsetStyleOverrides {
    readonly base?: ClassValue;
    readonly rounded?: Partial<Record<NonNullable<FieldsetFieldsetVariantProps["rounded"]>, ClassValue>>;
    readonly disabled?: Partial<Record<`${NonNullable<FieldsetFieldsetVariantProps["disabled"]>}`, ClassValue>>;
    readonly compoundVariants?: readonly FieldsetFieldsetCompoundStyleOverride[];
}

export interface FieldsetLegendCompoundStyleOverride {
    readonly when: Partial<FieldsetLegendVariantProps>;
    readonly class: ClassValue;
}

export interface FieldsetLegendStyleOverrides {
    readonly base?: ClassValue;
    readonly rounded?: Partial<Record<NonNullable<FieldsetLegendVariantProps["rounded"]>, ClassValue>>;
    readonly hasTemplate?: Partial<Record<`${NonNullable<FieldsetLegendVariantProps["hasTemplate"]>}`, ClassValue>>;
    readonly compoundVariants?: readonly FieldsetLegendCompoundStyleOverride[];
}

export interface FieldsetStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly base?: FieldsetBaseStyleOverrides;
    readonly fieldset?: FieldsetFieldsetStyleOverrides;
    readonly legend?: FieldsetLegendStyleOverrides;
}

export type FieldsetStylesProviderConfig = FieldsetStyleOverrides | { readonly strategy: FieldsetStyleStrategy };
