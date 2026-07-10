import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type { buttonGroupVariants as monaButtonGroupVariants } from "./button-group.mona.styles";

export type ButtonGroupVariantsFunction = (props?: ButtonGroupVariantProps) => string;
export type ButtonGroupVariantProps = VariantProps<typeof monaButtonGroupVariants>;
export type ButtonGroupVariantsInput = VariantInputs<ButtonGroupVariantProps>;
export type ButtonGroupStyleStrategy = ThemeStrategy<ButtonGroupVariantsFunction>;

export interface ButtonGroupStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly base?: ClassValue;
    readonly look?: Partial<Record<NonNullable<ButtonGroupVariantProps["look"]>, ClassValue>>;
    readonly rounded?: Partial<Record<NonNullable<ButtonGroupVariantProps["rounded"]>, ClassValue>>;
    readonly size?: Partial<Record<NonNullable<ButtonGroupVariantProps["size"]>, ClassValue>>;
    readonly compoundVariants?: readonly ButtonGroupCompoundStyleOverride[];
}

export interface ButtonGroupCompoundStyleOverride {
    readonly when: Partial<ButtonGroupVariantProps>;
    readonly class: ClassValue;
}

export type ButtonGroupStylesProviderConfig =
    | ButtonGroupStyleOverrides
    | { readonly strategy: ButtonGroupStyleStrategy };
