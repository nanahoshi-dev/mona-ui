import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type {
    numericTextboxButtonVariants as monaNumericTextboxButtonVariants,
    numericTextboxInputVariants as monaNumericTextboxInputVariants,
    numericTextboxVariants as monaNumericTextboxVariants
} from "./numeric-textbox.mona.styles";

export type NumericTextboxBaseVariantProps = VariantProps<typeof monaNumericTextboxVariants>;
export type NumericTextboxInputVariantProps = VariantProps<typeof monaNumericTextboxInputVariants>;
export type NumericTextboxButtonVariantProps = VariantProps<typeof monaNumericTextboxButtonVariants>;

export type NumericTextboxVariantProps = NumericTextboxBaseVariantProps;
export type NumericTextboxVariantInputs = VariantInputs<NumericTextboxVariantProps>;

export interface NumericTextboxBaseStyleOverride {
    readonly root?: ClassValue;
    readonly rounded?: Partial<Record<NonNullable<NumericTextboxBaseVariantProps["rounded"]>, ClassValue>>;
    readonly size?: Partial<Record<NonNullable<NumericTextboxBaseVariantProps["size"]>, ClassValue>>;
}

export interface NumericTextboxInputStyleOverride {
    readonly root?: ClassValue;
    readonly leftRounded?: Partial<Record<NonNullable<NumericTextboxInputVariantProps["leftRounded"]>, ClassValue>>;
    readonly rightRounded?: Partial<Record<NonNullable<NumericTextboxInputVariantProps["rightRounded"]>, ClassValue>>;
}

export interface NumericTextboxButtonStyleOverride {
    readonly root?: ClassValue;
    readonly size?: Partial<Record<NonNullable<NumericTextboxButtonVariantProps["size"]>, ClassValue>>;
}

export interface NumericTextboxStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly base?: NumericTextboxBaseStyleOverride;
    readonly input?: NumericTextboxInputStyleOverride;
    readonly button?: NumericTextboxButtonStyleOverride;
}

export interface NumericTextboxVariantsBundle {
    readonly base: (props?: NumericTextboxBaseVariantProps) => string;
    readonly input: (props?: NumericTextboxInputVariantProps) => string;
    readonly button: (props?: NumericTextboxButtonVariantProps) => string;
}

export type NumericTextboxStyleStrategy = ThemeStrategy<NumericTextboxVariantsBundle>;
export type NumericTextboxStylesProviderConfig =
    | NumericTextboxStyleOverrides
    | { readonly strategy: NumericTextboxStyleStrategy };
