import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type { textAreaVariants as monaTextAreaVariants } from "./textarea.mona.styles";

export type TextAreaVariantsFunction = (props?: TextAreaVariantProps) => string;
export type TextAreaVariantProps = VariantProps<typeof monaTextAreaVariants>;
export type TextAreaVariantInput = VariantInputs<TextAreaVariantProps>;

export interface TextAreaVariantsFunctions {
    readonly base: TextAreaVariantsFunction;
}

export type TextAreaStyleStrategy = ThemeStrategy<TextAreaVariantsFunctions>;

export interface TextAreaBaseCompoundStyleOverride {
    readonly when: Partial<TextAreaVariantProps>;
    readonly class: ClassValue;
}

export interface TextAreaBaseStyleOverrides {
    readonly base?: ClassValue;
    readonly rounded?: Partial<Record<NonNullable<TextAreaVariantProps["rounded"]>, ClassValue>>;
    readonly compoundVariants?: readonly TextAreaBaseCompoundStyleOverride[];
}

export interface TextAreaStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly base?: TextAreaBaseStyleOverrides;
}

export type TextAreaStylesProviderConfig = TextAreaStyleOverrides | { readonly strategy: TextAreaStyleStrategy };
