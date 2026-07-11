import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type {
    dateTimePickerBaseVariants as monaDateTimePickerBaseVariants,
    dateTimePickerFooterVariants as monaDateTimePickerFooterVariants,
    dateTimePickerHeaderVariants as monaDateTimePickerHeaderVariants
} from "./datetime-picker.mona.styles";

export type DateTimePickerBaseVariantsFunction = (props?: DateTimePickerBaseVariantProps) => string;
export type DateTimePickerBaseVariantProps = VariantProps<typeof monaDateTimePickerBaseVariants>;

export type DateTimePickerHeaderVariantsFunction = (props?: DateTimePickerHeaderVariantProps) => string;
export type DateTimePickerHeaderVariantProps = VariantProps<typeof monaDateTimePickerHeaderVariants>;

export type DateTimePickerFooterVariantsFunction = (props?: DateTimePickerFooterVariantProps) => string;
export type DateTimePickerFooterVariantProps = VariantProps<typeof monaDateTimePickerFooterVariants>;

export type DateTimePickerBaseVariantInput = VariantInputs<DateTimePickerBaseVariantProps>;
export type DateTimePickerHeaderVariantInput = VariantInputs<DateTimePickerHeaderVariantProps>;
export type DateTimePickerFooterVariantInput = VariantInputs<DateTimePickerFooterVariantProps>;

export type DateTimePickerVariantProps = DateTimePickerBaseVariantProps &
    DateTimePickerHeaderVariantProps &
    DateTimePickerFooterVariantProps;
export type DateTimePickerVariantInput = Omit<DateTimePickerBaseVariantInput, "focused"> &
    DateTimePickerHeaderVariantInput &
    DateTimePickerFooterVariantInput;

export interface DateTimePickerVariantsFunctions {
    readonly base: DateTimePickerBaseVariantsFunction;
    readonly footer: DateTimePickerFooterVariantsFunction;
    readonly header: DateTimePickerHeaderVariantsFunction;
}

export type DateTimePickerStyleStrategy = ThemeStrategy<DateTimePickerVariantsFunctions>;

export interface DateTimePickerBaseCompoundStyleOverride {
    readonly when: Partial<DateTimePickerBaseVariantProps>;
    readonly class: ClassValue;
}

export interface DateTimePickerBaseStyleOverrides {
    readonly base?: ClassValue;
    readonly focused?: Partial<Record<`${NonNullable<DateTimePickerBaseVariantProps["focused"]>}`, ClassValue>>;
    readonly rounded?: Partial<Record<NonNullable<DateTimePickerBaseVariantProps["rounded"]>, ClassValue>>;
    readonly size?: Partial<Record<NonNullable<DateTimePickerBaseVariantProps["size"]>, ClassValue>>;
    readonly compoundVariants?: readonly DateTimePickerBaseCompoundStyleOverride[];
}

export interface DateTimePickerHeaderStyleOverrides {
    readonly base?: ClassValue;
}

export interface DateTimePickerFooterStyleOverrides {
    readonly base?: ClassValue;
}

export interface DateTimePickerStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly base?: DateTimePickerBaseStyleOverrides;
    readonly footer?: DateTimePickerFooterStyleOverrides;
    readonly header?: DateTimePickerHeaderStyleOverrides;
}

export type DateTimePickerStylesProviderConfig =
    | DateTimePickerStyleOverrides
    | { readonly strategy: DateTimePickerStyleStrategy };
