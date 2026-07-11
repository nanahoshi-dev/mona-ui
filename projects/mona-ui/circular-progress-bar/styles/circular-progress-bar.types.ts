import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type { circularProgressBarBaseVariants as monaCircularProgressBarBaseVariants } from "./circular-progress-bar.mona.styles";

export type CircularProgressBarBaseVariantsFunction = (props?: CircularProgressBarBaseVariantProps) => string;
export type CircularProgressBarBaseVariantProps = VariantProps<typeof monaCircularProgressBarBaseVariants>;

export type CircularProgressBarBaseVariantInput = VariantInputs<CircularProgressBarBaseVariantProps>;

export type CircularProgressBarVariantProps = CircularProgressBarBaseVariantProps;
export type CircularProgressBarVariantInput = CircularProgressBarBaseVariantInput;

export interface CircularProgressBarVariantsFunctions {
    readonly base: CircularProgressBarBaseVariantsFunction;
}

export type CircularProgressBarStyleStrategy = ThemeStrategy<CircularProgressBarVariantsFunctions>;

export interface CircularProgressBarBaseCompoundStyleOverride {
    readonly when: Partial<CircularProgressBarBaseVariantProps>;
    readonly class: ClassValue;
}

export interface CircularProgressBarBaseStyleOverrides {
    readonly base?: ClassValue;
    readonly disabled?: Partial<Record<`${NonNullable<CircularProgressBarBaseVariantProps["disabled"]>}`, ClassValue>>;
    readonly compoundVariants?: readonly CircularProgressBarBaseCompoundStyleOverride[];
}

export interface CircularProgressBarStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly base?: CircularProgressBarBaseStyleOverrides;
}

export type CircularProgressBarStylesProviderConfig =
    | CircularProgressBarStyleOverrides
    | { readonly strategy: CircularProgressBarStyleStrategy };
