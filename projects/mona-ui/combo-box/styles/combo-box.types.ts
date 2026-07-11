import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type {
    comboBoxAffixContainerVariants as monaComboBoxAffixContainerVariants,
    comboBoxBaseVariants as monaComboBoxBaseVariants,
    comboBoxTextInputVariants as monaComboBoxTextInputVariants
} from "./combo-box.mona.styles";

export type ComboBoxBaseVariantsFunction = (props?: ComboBoxBaseVariantProps) => string;
export type ComboBoxBaseVariantProps = VariantProps<typeof monaComboBoxBaseVariants>;

export type ComboBoxTextInputVariantsFunction = (props?: ComboBoxTextInputVariantProps) => string;
export type ComboBoxTextInputVariantProps = VariantProps<typeof monaComboBoxTextInputVariants>;

export type ComboBoxAffixContainerVariantsFunction = (props?: ComboBoxAffixContainerVariantProps) => string;
export type ComboBoxAffixContainerVariantProps = VariantProps<typeof monaComboBoxAffixContainerVariants>;

export type ComboBoxBaseVariantInput = VariantInputs<ComboBoxBaseVariantProps>;
export type ComboBoxTextInputVariantInput = VariantInputs<ComboBoxTextInputVariantProps>;
export type ComboBoxAffixContainerVariantInput = VariantInputs<ComboBoxAffixContainerVariantProps>;

export type ComboBoxVariantProps = ComboBoxBaseVariantProps &
    ComboBoxTextInputVariantProps &
    ComboBoxAffixContainerVariantProps;

export type ComboBoxVariantInput = Omit<ComboBoxBaseVariantInput, "focused" | "invalid"> &
    ComboBoxTextInputVariantInput &
    ComboBoxAffixContainerVariantInput;

export interface ComboBoxVariantsFunctions {
    readonly affixContainer: ComboBoxAffixContainerVariantsFunction;
    readonly base: ComboBoxBaseVariantsFunction;
    readonly textInput: ComboBoxTextInputVariantsFunction;
}

export type ComboBoxStyleStrategy = ThemeStrategy<ComboBoxVariantsFunctions>;

export interface ComboBoxBaseCompoundStyleOverride {
    readonly when: Partial<ComboBoxBaseVariantProps>;
    readonly class: ClassValue;
}

export interface ComboBoxBaseStyleOverrides {
    readonly base?: ClassValue;
    readonly disabled?: Partial<Record<`${NonNullable<ComboBoxBaseVariantProps["disabled"]>}`, ClassValue>>;
    readonly focused?: Partial<Record<`${NonNullable<ComboBoxBaseVariantProps["focused"]>}`, ClassValue>>;
    readonly invalid?: Partial<Record<`${NonNullable<ComboBoxBaseVariantProps["invalid"]>}`, ClassValue>>;
    readonly rounded?: Partial<Record<NonNullable<ComboBoxBaseVariantProps["rounded"]>, ClassValue>>;
    readonly size?: Partial<Record<NonNullable<ComboBoxBaseVariantProps["size"]>, ClassValue>>;
    readonly compoundVariants?: readonly ComboBoxBaseCompoundStyleOverride[];
}

export interface ComboBoxTextInputCompoundStyleOverride {
    readonly when: Partial<ComboBoxTextInputVariantProps>;
    readonly class: ClassValue;
}

export interface ComboBoxTextInputStyleOverrides {
    readonly base?: ClassValue;
    readonly rounded?: Partial<Record<NonNullable<ComboBoxTextInputVariantProps["rounded"]>, ClassValue>>;
    readonly compoundVariants?: readonly ComboBoxTextInputCompoundStyleOverride[];
}

export interface ComboBoxAffixContainerStyleOverrides {
    readonly base?: ClassValue;
}

export interface ComboBoxStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly affixContainer?: ComboBoxAffixContainerStyleOverrides;
    readonly base?: ComboBoxBaseStyleOverrides;
    readonly textInput?: ComboBoxTextInputStyleOverrides;
}

export type ComboBoxStylesProviderConfig = ComboBoxStyleOverrides | { readonly strategy: ComboBoxStyleStrategy };
