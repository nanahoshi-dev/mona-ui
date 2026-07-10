import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type { buttonVariants as monaButtonVariants } from "./button.mona.styles";

export type ButtonVariantsFunction = (props?: ButtonVariantProps) => string;
export type ButtonVariantProps = VariantProps<typeof monaButtonVariants>;
export type ButtonVariantsInput = VariantInputs<ButtonVariantProps>;
export type ButtonStyleStrategy = ThemeStrategy<ButtonVariantsFunction>;

export interface ButtonStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly base?: ClassValue;
    readonly disabled?: Partial<Record<"true" | "false", ClassValue>>;
    readonly iconOnly?: Partial<Record<"true" | "false", ClassValue>>;
    readonly loading?: Partial<Record<"true" | "false", ClassValue>>;
    readonly look?: Partial<Record<NonNullable<ButtonVariantProps["look"]>, ClassValue>>;
    readonly rounded?: Partial<Record<NonNullable<ButtonVariantProps["rounded"]>, ClassValue>>;
    readonly size?: Partial<Record<NonNullable<ButtonVariantProps["size"]>, ClassValue>>;
    readonly selected?: Partial<Record<"true", ClassValue>>;
    readonly compoundVariants?: readonly ButtonCompoundStyleOverride[];
}

export interface ButtonCompoundStyleOverride {
    readonly when: Partial<ButtonVariantProps>;
    readonly class: ClassValue;
}

export type ButtonStylesProviderConfig = ButtonStyleOverrides | { readonly strategy: ButtonStyleStrategy };
