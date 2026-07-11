import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type {
    multiSelectAffixContainerVariants as monaMultiSelectAffixContainerVariants,
    multiSelectBaseVariants as monaMultiSelectBaseVariants,
    multiSelectIndicatorContainerVariants as monaMultiSelectIndicatorContainerVariants,
    multiSelectItemContainerVariants as monaMultiSelectItemContainerVariants
} from "./multi-select.mona.styles";

export type MultiSelectBaseVariantsFunction = (props?: MultiSelectBaseVariantProps) => string;
export type MultiSelectBaseVariantProps = VariantProps<typeof monaMultiSelectBaseVariants>;

export type MultiSelectItemContainerVariantsFunction = (props?: MultiSelectItemContainerVariantProps) => string;
export type MultiSelectItemContainerVariantProps = VariantProps<typeof monaMultiSelectItemContainerVariants>;

export type MultiSelectAffixContainerVariantsFunction = (props?: MultiSelectAffixContainerVariantProps) => string;
export type MultiSelectAffixContainerVariantProps = VariantProps<typeof monaMultiSelectAffixContainerVariants>;

export type MultiSelectIndicatorContainerVariantsFunction = (
    props?: MultiSelectIndicatorContainerVariantProps
) => string;
export type MultiSelectIndicatorContainerVariantProps = VariantProps<
    typeof monaMultiSelectIndicatorContainerVariants
>;

export type MultiSelectBaseVariantInput = VariantInputs<MultiSelectBaseVariantProps>;
export type MultiSelectItemContainerVariantInput = VariantInputs<MultiSelectItemContainerVariantProps>;
export type MultiSelectAffixContainerVariantInput = VariantInputs<MultiSelectAffixContainerVariantProps>;
export type MultiSelectIndicatorContainerVariantInput = VariantInputs<MultiSelectIndicatorContainerVariantProps>;

export type MultiSelectVariantProps = MultiSelectBaseVariantProps &
    MultiSelectItemContainerVariantProps &
    MultiSelectAffixContainerVariantProps &
    MultiSelectIndicatorContainerVariantProps;

export type MultiSelectVariantInput = Omit<MultiSelectBaseVariantInput, "focused" | "invalid"> &
    MultiSelectItemContainerVariantInput &
    MultiSelectAffixContainerVariantInput &
    MultiSelectIndicatorContainerVariantInput;

export interface MultiSelectVariantsFunctions {
    readonly affixContainer: MultiSelectAffixContainerVariantsFunction;
    readonly base: MultiSelectBaseVariantsFunction;
    readonly indicatorContainer: MultiSelectIndicatorContainerVariantsFunction;
    readonly itemContainer: MultiSelectItemContainerVariantsFunction;
}

export type MultiSelectStyleStrategy = ThemeStrategy<MultiSelectVariantsFunctions>;

export interface MultiSelectBaseCompoundStyleOverride {
    readonly when: Partial<MultiSelectBaseVariantProps>;
    readonly class: ClassValue;
}

export interface MultiSelectBaseStyleOverrides {
    readonly base?: ClassValue;
    readonly disabled?: Partial<Record<`${NonNullable<MultiSelectBaseVariantProps["disabled"]>}`, ClassValue>>;
    readonly focused?: Partial<Record<`${NonNullable<MultiSelectBaseVariantProps["focused"]>}`, ClassValue>>;
    readonly invalid?: Partial<Record<`${NonNullable<MultiSelectBaseVariantProps["invalid"]>}`, ClassValue>>;
    readonly rounded?: Partial<Record<NonNullable<MultiSelectBaseVariantProps["rounded"]>, ClassValue>>;
    readonly size?: Partial<Record<NonNullable<MultiSelectBaseVariantProps["size"]>, ClassValue>>;
    readonly compoundVariants?: readonly MultiSelectBaseCompoundStyleOverride[];
}

export interface MultiSelectItemContainerCompoundStyleOverride {
    readonly when: Partial<MultiSelectItemContainerVariantProps>;
    readonly class: ClassValue;
}

export interface MultiSelectItemContainerStyleOverrides {
    readonly base?: ClassValue;
    readonly rounded?: Partial<Record<NonNullable<MultiSelectItemContainerVariantProps["rounded"]>, ClassValue>>;
    readonly compoundVariants?: readonly MultiSelectItemContainerCompoundStyleOverride[];
}

export interface MultiSelectAffixContainerStyleOverrides {
    readonly base?: ClassValue;
}

export interface MultiSelectIndicatorContainerCompoundStyleOverride {
    readonly when: Partial<MultiSelectIndicatorContainerVariantProps>;
    readonly class: ClassValue;
}

export interface MultiSelectIndicatorContainerStyleOverrides {
    readonly base?: ClassValue;
    readonly size?: Partial<Record<NonNullable<MultiSelectIndicatorContainerVariantProps["size"]>, ClassValue>>;
    readonly compoundVariants?: readonly MultiSelectIndicatorContainerCompoundStyleOverride[];
}

export interface MultiSelectStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly affixContainer?: MultiSelectAffixContainerStyleOverrides;
    readonly base?: MultiSelectBaseStyleOverrides;
    readonly indicatorContainer?: MultiSelectIndicatorContainerStyleOverrides;
    readonly itemContainer?: MultiSelectItemContainerStyleOverrides;
}

export type MultiSelectStylesProviderConfig =
    | MultiSelectStyleOverrides
    | { readonly strategy: MultiSelectStyleStrategy };
