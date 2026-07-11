import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type {
    autoCompleteAffixContainerVariants as monaAutoCompleteAffixContainerVariants,
    autoCompleteBaseVariants as monaAutoCompleteBaseVariants,
    autoCompleteTextInputVariants as monaAutoCompleteTextInputVariants
} from "./auto-complete.mona.styles";

export type AutoCompleteBaseVariantsFunction = (props?: AutoCompleteBaseVariantProps) => string;
export type AutoCompleteBaseVariantProps = VariantProps<typeof monaAutoCompleteBaseVariants>;

export type AutoCompleteTextInputVariantsFunction = (props?: AutoCompleteTextInputVariantProps) => string;
export type AutoCompleteTextInputVariantProps = VariantProps<typeof monaAutoCompleteTextInputVariants>;

export type AutoCompleteAffixContainerVariantsFunction = (props?: AutoCompleteAffixContainerVariantProps) => string;
export type AutoCompleteAffixContainerVariantProps = VariantProps<typeof monaAutoCompleteAffixContainerVariants>;

export type AutoCompleteBaseVariantInput = VariantInputs<AutoCompleteBaseVariantProps>;
export type AutoCompleteTextInputVariantInput = VariantInputs<AutoCompleteTextInputVariantProps>;
export type AutoCompleteAffixContainerVariantInput = VariantInputs<AutoCompleteAffixContainerVariantProps>;

export type AutoCompleteVariantProps = AutoCompleteBaseVariantProps &
    AutoCompleteTextInputVariantProps &
    AutoCompleteAffixContainerVariantProps;

export type AutoCompleteVariantInput = Omit<AutoCompleteBaseVariantInput, "expanded" | "focused" | "invalid"> &
    AutoCompleteTextInputVariantInput &
    AutoCompleteAffixContainerVariantInput;

export interface AutoCompleteVariantsFunctions {
    readonly affixContainer: AutoCompleteAffixContainerVariantsFunction;
    readonly base: AutoCompleteBaseVariantsFunction;
    readonly textInput: AutoCompleteTextInputVariantsFunction;
}

export type AutoCompleteStyleStrategy = ThemeStrategy<AutoCompleteVariantsFunctions>;

export interface AutoCompleteBaseCompoundStyleOverride {
    readonly when: Partial<AutoCompleteBaseVariantProps>;
    readonly class: ClassValue;
}

export interface AutoCompleteBaseStyleOverrides {
    readonly base?: ClassValue;
    readonly disabled?: Partial<Record<`${NonNullable<AutoCompleteBaseVariantProps["disabled"]>}`, ClassValue>>;
    readonly expanded?: Partial<Record<`${NonNullable<AutoCompleteBaseVariantProps["expanded"]>}`, ClassValue>>;
    readonly focused?: Partial<Record<`${NonNullable<AutoCompleteBaseVariantProps["focused"]>}`, ClassValue>>;
    readonly invalid?: Partial<Record<`${NonNullable<AutoCompleteBaseVariantProps["invalid"]>}`, ClassValue>>;
    readonly rounded?: Partial<Record<NonNullable<AutoCompleteBaseVariantProps["rounded"]>, ClassValue>>;
    readonly size?: Partial<Record<NonNullable<AutoCompleteBaseVariantProps["size"]>, ClassValue>>;
    readonly compoundVariants?: readonly AutoCompleteBaseCompoundStyleOverride[];
}

export interface AutoCompleteTextInputCompoundStyleOverride {
    readonly when: Partial<AutoCompleteTextInputVariantProps>;
    readonly class: ClassValue;
}

export interface AutoCompleteTextInputStyleOverrides {
    readonly base?: ClassValue;
    readonly rounded?: Partial<Record<NonNullable<AutoCompleteTextInputVariantProps["rounded"]>, ClassValue>>;
    readonly compoundVariants?: readonly AutoCompleteTextInputCompoundStyleOverride[];
}

export interface AutoCompleteAffixContainerStyleOverrides {
    readonly base?: ClassValue;
}

export interface AutoCompleteStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly affixContainer?: AutoCompleteAffixContainerStyleOverrides;
    readonly base?: AutoCompleteBaseStyleOverrides;
    readonly textInput?: AutoCompleteTextInputStyleOverrides;
}

export type AutoCompleteStylesProviderConfig =
    | AutoCompleteStyleOverrides
    | { readonly strategy: AutoCompleteStyleStrategy };
