import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type {
    tooltipArrowVariants as monaTooltipArrowVariants,
    tooltipBaseVariants as monaTooltipBaseVariants
} from "./tooltip.mona.styles";

export type TooltipBaseVariantsFunction = (props?: TooltipBaseVariantProps) => string;
export type TooltipBaseVariantProps = VariantProps<typeof monaTooltipBaseVariants>;

export type TooltipArrowVariantsFunction = (props?: TooltipArrowVariantProps) => string;
export type TooltipArrowVariantProps = VariantProps<typeof monaTooltipArrowVariants>;

export type TooltipBaseVariantInputs = VariantInputs<TooltipBaseVariantProps>;
export type TooltipArrowVariantInputs = VariantInputs<TooltipArrowVariantProps>;

export type TooltipVariantProps = TooltipBaseVariantProps & TooltipArrowVariantProps;
export type TooltipVariantInputs = TooltipBaseVariantInputs & TooltipArrowVariantInputs;

export interface TooltipVariantsFunctions {
    readonly base: TooltipBaseVariantsFunction;
    readonly arrow: TooltipArrowVariantsFunction;
}

export type TooltipStyleStrategy = ThemeStrategy<TooltipVariantsFunctions>;

export interface TooltipBaseCompoundStyleOverride {
    readonly when: Partial<TooltipBaseVariantProps>;
    readonly class: ClassValue;
}

export interface TooltipBaseStyleOverrides {
    readonly base?: ClassValue;
    readonly rounded?: Partial<Record<NonNullable<TooltipBaseVariantProps["rounded"]>, ClassValue>>;
    readonly compoundVariants?: readonly TooltipBaseCompoundStyleOverride[];
}

export interface TooltipArrowStyleOverrides {
    readonly base?: ClassValue;
}

export interface TooltipStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly base?: TooltipBaseStyleOverrides;
    readonly arrow?: TooltipArrowStyleOverrides;
}

export type TooltipStylesProviderConfig = TooltipStyleOverrides | { readonly strategy: TooltipStyleStrategy };
