import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type { TooltipArrowVariantInputs, TooltipArrowVariantProps } from "@nanahoshi/mona-ui/tooltip";
import type {
    popoverBaseVariants as monaPopoverBaseVariants,
    popoverContentVariants as monaPopoverContentVariants,
    popoverHeaderVariants as monaPopoverHeaderVariants
} from "./popover.mona.styles";

export type PopoverBaseVariantsFunction = (props?: PopoverBaseVariantProps) => string;
export type PopoverBaseVariantProps = VariantProps<typeof monaPopoverBaseVariants>;

export type PopoverHeaderVariantsFunction = (props?: PopoverHeaderVariantProps) => string;
export type PopoverHeaderVariantProps = VariantProps<typeof monaPopoverHeaderVariants>;

export type PopoverContentVariantsFunction = (props?: PopoverContentVariantProps) => string;
export type PopoverContentVariantProps = VariantProps<typeof monaPopoverContentVariants>;

export type PopoverArrowVariantProps = TooltipArrowVariantProps;

export type PopoverBaseVariantInputs = VariantInputs<PopoverBaseVariantProps>;
export type PopoverHeaderVariantInputs = VariantInputs<PopoverHeaderVariantProps>;
export type PopoverContentVariantInputs = VariantInputs<PopoverContentVariantProps>;
export type PopoverArrowVariantInputs = TooltipArrowVariantInputs;

export type PopoverVariantProps = PopoverBaseVariantProps &
    PopoverHeaderVariantProps &
    PopoverContentVariantProps &
    PopoverArrowVariantProps;
export type PopoverVariantInputs = PopoverBaseVariantInputs &
    PopoverHeaderVariantInputs &
    PopoverContentVariantInputs &
    PopoverArrowVariantInputs;

export interface PopoverVariantsFunctions {
    readonly base: PopoverBaseVariantsFunction;
    readonly header: PopoverHeaderVariantsFunction;
    readonly content: PopoverContentVariantsFunction;
}

export type PopoverStyleStrategy = ThemeStrategy<PopoverVariantsFunctions>;

export interface PopoverBaseCompoundStyleOverride {
    readonly when: Partial<PopoverBaseVariantProps>;
    readonly class: ClassValue;
}

export interface PopoverBaseStyleOverrides {
    readonly base?: ClassValue;
    readonly rounded?: Partial<Record<NonNullable<PopoverBaseVariantProps["rounded"]>, ClassValue>>;
    readonly compoundVariants?: readonly PopoverBaseCompoundStyleOverride[];
}

export interface PopoverHeaderCompoundStyleOverride {
    readonly when: Partial<PopoverHeaderVariantProps>;
    readonly class: ClassValue;
}

export interface PopoverHeaderStyleOverrides {
    readonly base?: ClassValue;
    readonly rounded?: Partial<Record<NonNullable<PopoverHeaderVariantProps["rounded"]>, ClassValue>>;
    readonly compoundVariants?: readonly PopoverHeaderCompoundStyleOverride[];
}

export interface PopoverContentStyleOverrides {
    readonly base?: ClassValue;
}

export interface PopoverStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly base?: PopoverBaseStyleOverrides;
    readonly header?: PopoverHeaderStyleOverrides;
    readonly content?: PopoverContentStyleOverrides;
}

export type PopoverStylesProviderConfig = PopoverStyleOverrides | { readonly strategy: PopoverStyleStrategy };
