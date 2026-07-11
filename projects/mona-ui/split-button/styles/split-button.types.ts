import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type { splitButtonVariants as monaSplitButtonVariants } from "./split-button.mona.styles";

export type SplitButtonVariantsFunction = (props?: SplitButtonVariantProps) => string;
export type SplitButtonVariantProps = VariantProps<typeof monaSplitButtonVariants>;
export type SplitButtonVariantInputs = VariantInputs<SplitButtonVariantProps>;
export type SplitButtonStyleStrategy = ThemeStrategy<SplitButtonVariantsFunction>;

export interface SplitButtonStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly base?: ClassValue;
    readonly look?: Partial<Record<NonNullable<SplitButtonVariantProps["look"]>, ClassValue>>;
    readonly rounded?: Partial<Record<NonNullable<SplitButtonVariantProps["rounded"]>, ClassValue>>;
    readonly size?: Partial<Record<NonNullable<SplitButtonVariantProps["size"]>, ClassValue>>;
}

export type SplitButtonStylesProviderConfig =
    | SplitButtonStyleOverrides
    | { readonly strategy: SplitButtonStyleStrategy };
