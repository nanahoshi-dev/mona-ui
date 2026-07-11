import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type {
    dropdownListAffixContainerVariants as monaDropdownListAffixContainerVariants,
    dropdownListInputVariants as monaDropdownListInputVariants,
    dropdownListValueContainerVariants as monaDropdownListValueContainerVariants
} from "./dropdown-list.mona.styles";

export type DropdownListInputVariantsFunction = (props?: DropdownListInputVariantProps) => string;
export type DropdownListInputVariantProps = VariantProps<typeof monaDropdownListInputVariants>;

export type DropdownListAffixContainerVariantsFunction = (props?: DropdownListAffixContainerVariantProps) => string;
export type DropdownListAffixContainerVariantProps = VariantProps<typeof monaDropdownListAffixContainerVariants>;

export type DropdownListValueContainerVariantsFunction = (props?: DropdownListValueContainerVariantProps) => string;
export type DropdownListValueContainerVariantProps = VariantProps<typeof monaDropdownListValueContainerVariants>;

export type DropdownListInputVariantInput = VariantInputs<DropdownListInputVariantProps>;
export type DropdownListAffixContainerVariantInput = VariantInputs<DropdownListAffixContainerVariantProps>;
export type DropdownListValueContainerVariantInput = VariantInputs<DropdownListValueContainerVariantProps>;

export type DropDownListVariantProps = DropdownListInputVariantProps &
    DropdownListAffixContainerVariantProps &
    DropdownListValueContainerVariantProps;

export type DropDownListVariantInput = Omit<DropdownListInputVariantInput, "expanded" | "hasPrefix" | "invalid"> &
    DropdownListAffixContainerVariantInput &
    Omit<DropdownListValueContainerVariantInput, "hasTemplate">;

export interface DropdownListVariantsFunctions {
    readonly affixContainer: DropdownListAffixContainerVariantsFunction;
    readonly input: DropdownListInputVariantsFunction;
    readonly valueContainer: DropdownListValueContainerVariantsFunction;
}

export type DropdownListStyleStrategy = ThemeStrategy<DropdownListVariantsFunctions>;

export interface DropdownListInputCompoundStyleOverride {
    readonly when: Partial<DropdownListInputVariantProps>;
    readonly class: ClassValue;
}

export interface DropdownListInputStyleOverrides {
    readonly base?: ClassValue;
    readonly disabled?: Partial<Record<`${NonNullable<DropdownListInputVariantProps["disabled"]>}`, ClassValue>>;
    readonly expanded?: Partial<Record<`${NonNullable<DropdownListInputVariantProps["expanded"]>}`, ClassValue>>;
    readonly hasPrefix?: Partial<Record<`${NonNullable<DropdownListInputVariantProps["hasPrefix"]>}`, ClassValue>>;
    readonly invalid?: Partial<Record<`${NonNullable<DropdownListInputVariantProps["invalid"]>}`, ClassValue>>;
    readonly rounded?: Partial<Record<NonNullable<DropdownListInputVariantProps["rounded"]>, ClassValue>>;
    readonly size?: Partial<Record<NonNullable<DropdownListInputVariantProps["size"]>, ClassValue>>;
    readonly compoundVariants?: readonly DropdownListInputCompoundStyleOverride[];
}

export interface DropdownListAffixContainerStyleOverrides {
    readonly base?: ClassValue;
}

export interface DropdownListValueContainerCompoundStyleOverride {
    readonly when: Partial<DropdownListValueContainerVariantProps>;
    readonly class: ClassValue;
}

export interface DropdownListValueContainerStyleOverrides {
    readonly base?: ClassValue;
    readonly hasTemplate?: Partial<
        Record<`${NonNullable<DropdownListValueContainerVariantProps["hasTemplate"]>}`, ClassValue>
    >;
    readonly compoundVariants?: readonly DropdownListValueContainerCompoundStyleOverride[];
}

export interface DropdownListStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly affixContainer?: DropdownListAffixContainerStyleOverrides;
    readonly input?: DropdownListInputStyleOverrides;
    readonly valueContainer?: DropdownListValueContainerStyleOverrides;
}

export type DropdownListStylesProviderConfig =
    | DropdownListStyleOverrides
    | { readonly strategy: DropdownListStyleStrategy };
