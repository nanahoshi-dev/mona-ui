import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type { timePickerBaseVariants as monaTimePickerBaseVariants } from "./time-picker.mona.styles";

export type TimePickerBaseVariantsFunction = (props?: TimePickerBaseVariantProps) => string;
export type TimePickerBaseVariantProps = VariantProps<typeof monaTimePickerBaseVariants>;

export type TimePickerBaseVariantInput = VariantInputs<TimePickerBaseVariantProps>;

export type TimePickerVariantProps = TimePickerBaseVariantProps;
export type TimePickerVariantInput = Omit<TimePickerBaseVariantInput, "focused">;

export interface TimePickerVariantsFunctions {
    readonly base: TimePickerBaseVariantsFunction;
}

export type TimePickerStyleStrategy = ThemeStrategy<TimePickerVariantsFunctions>;

export interface TimePickerBaseCompoundStyleOverride {
    readonly when: Partial<TimePickerBaseVariantProps>;
    readonly class: ClassValue;
}

export interface TimePickerBaseStyleOverrides {
    readonly base?: ClassValue;
    readonly focused?: Partial<Record<`${NonNullable<TimePickerBaseVariantProps["focused"]>}`, ClassValue>>;
    readonly rounded?: Partial<Record<NonNullable<TimePickerBaseVariantProps["rounded"]>, ClassValue>>;
    readonly size?: Partial<Record<NonNullable<TimePickerBaseVariantProps["size"]>, ClassValue>>;
    readonly compoundVariants?: readonly TimePickerBaseCompoundStyleOverride[];
}

export interface TimePickerStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly base?: TimePickerBaseStyleOverrides;
}

export type TimePickerStylesProviderConfig =
    | TimePickerStyleOverrides
    | { readonly strategy: TimePickerStyleStrategy };
