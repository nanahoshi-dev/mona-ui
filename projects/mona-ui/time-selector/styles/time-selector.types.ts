import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type {
    timeSelectorBaseVariants as monaTimeSelectorBaseVariants,
    timeSelectorFooterVariants as monaTimeSelectorFooterVariants,
    timeSelectorHeaderVariants as monaTimeSelectorHeaderVariants,
    timeSelectorInfoContainerVariants as monaTimeSelectorInfoContainerVariants,
    timeSelectorListContainerVariants as monaTimeSelectorListContainerVariants,
    timeSelectorListItemVariants as monaTimeSelectorListItemVariants,
    timeSelectorListVariants as monaTimeSelectorListVariants
} from "./time-selector.mona.styles";

export type TimeSelectorBaseVariantsFunction = (props?: TimeSelectorBaseVariantProps) => string;
export type TimeSelectorBaseVariantProps = VariantProps<typeof monaTimeSelectorBaseVariants>;

export type TimeSelectorFooterVariantsFunction = (props?: TimeSelectorFooterVariantProps) => string;
export type TimeSelectorFooterVariantProps = VariantProps<typeof monaTimeSelectorFooterVariants>;

export type TimeSelectorHeaderVariantsFunction = (props?: TimeSelectorHeaderVariantProps) => string;
export type TimeSelectorHeaderVariantProps = VariantProps<typeof monaTimeSelectorHeaderVariants>;

export type TimeSelectorInfoContainerVariantsFunction = (props?: TimeSelectorInfoContainerVariantProps) => string;
export type TimeSelectorInfoContainerVariantProps = VariantProps<typeof monaTimeSelectorInfoContainerVariants>;

export type TimeSelectorListContainerVariantsFunction = (props?: TimeSelectorListContainerVariantProps) => string;
export type TimeSelectorListContainerVariantProps = VariantProps<typeof monaTimeSelectorListContainerVariants>;

export type TimeSelectorListVariantsFunction = (props?: TimeSelectorListVariantProps) => string;
export type TimeSelectorListVariantProps = VariantProps<typeof monaTimeSelectorListVariants>;

export type TimeSelectorListItemVariantsFunction = (props?: TimeSelectorListItemVariantProps) => string;
export type TimeSelectorListItemVariantProps = VariantProps<typeof monaTimeSelectorListItemVariants>;

export type TimeSelectorBaseVariantInput = VariantInputs<TimeSelectorBaseVariantProps>;
export type TimeSelectorFooterVariantInput = VariantInputs<TimeSelectorFooterVariantProps>;
export type TimeSelectorHeaderVariantInput = VariantInputs<TimeSelectorHeaderVariantProps>;
export type TimeSelectorInfoContainerVariantInput = VariantInputs<TimeSelectorInfoContainerVariantProps>;
export type TimeSelectorListContainerVariantInput = VariantInputs<TimeSelectorListContainerVariantProps>;
export type TimeSelectorListVariantInput = VariantInputs<TimeSelectorListVariantProps>;
export type TimeSelectorListItemVariantInput = VariantInputs<TimeSelectorListItemVariantProps>;

export type TimeSelectorVariantProps = TimeSelectorBaseVariantProps &
    TimeSelectorHeaderVariantProps &
    TimeSelectorInfoContainerVariantProps &
    Omit<TimeSelectorListVariantProps, "size"> &
    Omit<TimeSelectorListItemVariantProps, "size">;

export type TimeSelectorVariantInput = TimeSelectorBaseVariantInput &
    TimeSelectorHeaderVariantInput &
    TimeSelectorInfoContainerVariantInput &
    Omit<TimeSelectorListVariantInput, "size"> &
    Omit<TimeSelectorListItemVariantInput, "size" | "selected">;

export interface TimeSelectorVariantsFunctions {
    readonly base: TimeSelectorBaseVariantsFunction;
    readonly footer: TimeSelectorFooterVariantsFunction;
    readonly header: TimeSelectorHeaderVariantsFunction;
    readonly infoContainer: TimeSelectorInfoContainerVariantsFunction;
    readonly list: TimeSelectorListVariantsFunction;
    readonly listContainer: TimeSelectorListContainerVariantsFunction;
    readonly listItem: TimeSelectorListItemVariantsFunction;
}

export type TimeSelectorStyleStrategy = ThemeStrategy<TimeSelectorVariantsFunctions>;

export interface TimeSelectorBaseCompoundStyleOverride {
    readonly when: Partial<TimeSelectorBaseVariantProps>;
    readonly class: ClassValue;
}

export interface TimeSelectorBaseStyleOverrides {
    readonly base?: ClassValue;
    readonly disabled?: Partial<Record<`${NonNullable<TimeSelectorBaseVariantProps["disabled"]>}`, ClassValue>>;
    readonly size?: Partial<Record<NonNullable<TimeSelectorBaseVariantProps["size"]>, ClassValue>>;
    readonly compoundVariants?: readonly TimeSelectorBaseCompoundStyleOverride[];
}

export interface TimeSelectorFooterStyleOverrides {
    readonly base?: ClassValue;
}

export interface TimeSelectorHeaderStyleOverrides {
    readonly base?: ClassValue;
}

export interface TimeSelectorInfoContainerStyleOverrides {
    readonly base?: ClassValue;
}

export interface TimeSelectorListContainerStyleOverrides {
    readonly base?: ClassValue;
}

export interface TimeSelectorListStyleOverrides {
    readonly base?: ClassValue;
    readonly size?: Partial<Record<NonNullable<TimeSelectorListVariantProps["size"]>, ClassValue>>;
}

export interface TimeSelectorListItemCompoundStyleOverride {
    readonly when: Partial<TimeSelectorListItemVariantProps>;
    readonly class: ClassValue;
}

export interface TimeSelectorListItemStyleOverrides {
    readonly base?: ClassValue;
    readonly selected?: Partial<Record<`${NonNullable<TimeSelectorListItemVariantProps["selected"]>}`, ClassValue>>;
    readonly size?: Partial<Record<NonNullable<TimeSelectorListItemVariantProps["size"]>, ClassValue>>;
    readonly compoundVariants?: readonly TimeSelectorListItemCompoundStyleOverride[];
}

export interface TimeSelectorStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly base?: TimeSelectorBaseStyleOverrides;
    readonly footer?: TimeSelectorFooterStyleOverrides;
    readonly header?: TimeSelectorHeaderStyleOverrides;
    readonly infoContainer?: TimeSelectorInfoContainerStyleOverrides;
    readonly list?: TimeSelectorListStyleOverrides;
    readonly listContainer?: TimeSelectorListContainerStyleOverrides;
    readonly listItem?: TimeSelectorListItemStyleOverrides;
}

export type TimeSelectorStylesProviderConfig =
    | TimeSelectorStyleOverrides
    | { readonly strategy: TimeSelectorStyleStrategy };
