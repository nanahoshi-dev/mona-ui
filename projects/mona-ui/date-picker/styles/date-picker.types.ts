import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type { datePickerBaseVariants as monaDatePickerBaseVariants } from "./date-picker.mona.styles";

export type DatePickerBaseVariantsFunction = (props?: DatePickerBaseVariantProps) => string;
export type DatePickerBaseVariantProps = VariantProps<typeof monaDatePickerBaseVariants>;

export type DatePickerBaseVariantInput = VariantInputs<DatePickerBaseVariantProps>;

export type DatePickerVariantProps = DatePickerBaseVariantProps;
export type DatePickerVariantInput = Omit<DatePickerBaseVariantInput, "focused">;

export interface DatePickerVariantsFunctions {
    readonly base: DatePickerBaseVariantsFunction;
}

export type DatePickerStyleStrategy = ThemeStrategy<DatePickerVariantsFunctions>;

export interface DatePickerBaseCompoundStyleOverride {
    readonly when: Partial<DatePickerBaseVariantProps>;
    readonly class: ClassValue;
}

export interface DatePickerBaseStyleOverrides {
    readonly base?: ClassValue;
    readonly focused?: Partial<Record<`${NonNullable<DatePickerBaseVariantProps["focused"]>}`, ClassValue>>;
    readonly rounded?: Partial<Record<NonNullable<DatePickerBaseVariantProps["rounded"]>, ClassValue>>;
    readonly size?: Partial<Record<NonNullable<DatePickerBaseVariantProps["size"]>, ClassValue>>;
    readonly compoundVariants?: readonly DatePickerBaseCompoundStyleOverride[];
}

export interface DatePickerStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly base?: DatePickerBaseStyleOverrides;
}

export type DatePickerStylesProviderConfig =
    | DatePickerStyleOverrides
    | { readonly strategy: DatePickerStyleStrategy };
