import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type { textBoxVariants as monaTextBoxVariants, inputVariants as monaInputVariants } from "./textbox.mona.styles";

export type TextBoxBaseVariantProps = VariantProps<typeof monaTextBoxVariants>;
export type TextBoxInputVariantProps = VariantProps<typeof monaInputVariants>;

export type TextBoxVariantProps = TextBoxBaseVariantProps;
export type TextBoxVariantInput = VariantInputs<TextBoxVariantProps>;
export type TextBoxInputVariantInput = VariantInputs<TextBoxInputVariantProps>;

export interface TextBoxBaseStyleOverride {
    readonly root?: ClassValue;
    readonly rounded?: Partial<Record<NonNullable<TextBoxBaseVariantProps["rounded"]>, ClassValue>>;
    readonly size?: Partial<Record<NonNullable<TextBoxBaseVariantProps["size"]>, ClassValue>>;
}

export interface TextBoxInputStyleOverride {
    readonly root?: ClassValue;
    readonly rounded?: Partial<Record<NonNullable<TextBoxInputVariantProps["rounded"]>, ClassValue>>;
    readonly size?: Partial<Record<NonNullable<TextBoxInputVariantProps["size"]>, ClassValue>>;
}

export interface TextBoxStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly base?: TextBoxBaseStyleOverride;
    readonly input?: TextBoxInputStyleOverride;
}

export interface TextBoxVariantsBundle {
    readonly base: (props?: TextBoxBaseVariantProps) => string;
    readonly input: (props?: TextBoxInputVariantProps) => string;
}

export type TextBoxStyleStrategy = ThemeStrategy<TextBoxVariantsBundle>;
export type TextBoxStylesProviderConfig = TextBoxStyleOverrides | { readonly strategy: TextBoxStyleStrategy };
