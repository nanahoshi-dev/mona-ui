import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type {
    expansionPanelBaseVariants as monaExpansionPanelBaseVariants,
    expansionPanelContentVariants as monaExpansionPanelContentVariants,
    expansionPanelHeaderTitleVariants as monaExpansionPanelHeaderTitleVariants,
    expansionPanelHeaderVariants as monaExpansionPanelHeaderVariants,
    expansionPanelIconContainerVariants as monaExpansionPanelIconContainerVariants
} from "./expansion-panel.mona.styles";

export type ExpansionPanelBaseVariantsFunction = (props?: ExpansionPanelBaseVariantProps) => string;
export type ExpansionPanelBaseVariantProps = VariantProps<typeof monaExpansionPanelBaseVariants>;

export type ExpansionPanelHeaderVariantsFunction = (props?: ExpansionPanelHeaderVariantProps) => string;
export type ExpansionPanelHeaderVariantProps = VariantProps<typeof monaExpansionPanelHeaderVariants>;

export type ExpansionPanelHeaderTitleVariantsFunction = (props?: ExpansionPanelHeaderTitleVariantProps) => string;
export type ExpansionPanelHeaderTitleVariantProps = VariantProps<typeof monaExpansionPanelHeaderTitleVariants>;

export type ExpansionPanelIconContainerVariantsFunction = (
    props?: ExpansionPanelIconContainerVariantProps
) => string;
export type ExpansionPanelIconContainerVariantProps = VariantProps<typeof monaExpansionPanelIconContainerVariants>;

export type ExpansionPanelContentVariantsFunction = (props?: ExpansionPanelContentVariantProps) => string;
export type ExpansionPanelContentVariantProps = VariantProps<typeof monaExpansionPanelContentVariants>;

export type ExpansionPanelBaseVariantInput = VariantInputs<ExpansionPanelBaseVariantProps>;
export type ExpansionPanelHeaderVariantInput = VariantInputs<ExpansionPanelHeaderVariantProps>;
export type ExpansionPanelContentVariantInput = VariantInputs<ExpansionPanelContentVariantProps>;
export type ExpansionPanelIconContainerVariantInput = VariantInputs<ExpansionPanelIconContainerVariantProps>;

export type ExpansionPanelVariantProps = ExpansionPanelBaseVariantProps &
    ExpansionPanelHeaderVariantProps &
    ExpansionPanelContentVariantProps &
    ExpansionPanelIconContainerVariantProps;
export type ExpansionPanelVariantInput = ExpansionPanelBaseVariantInput &
    Omit<ExpansionPanelHeaderVariantInput, "collapsed"> &
    ExpansionPanelContentVariantInput &
    Omit<ExpansionPanelIconContainerVariantInput, "hasTemplate">;

export interface ExpansionPanelVariantsFunctions {
    readonly base: ExpansionPanelBaseVariantsFunction;
    readonly content: ExpansionPanelContentVariantsFunction;
    readonly header: ExpansionPanelHeaderVariantsFunction;
    readonly headerTitle: ExpansionPanelHeaderTitleVariantsFunction;
    readonly iconContainer: ExpansionPanelIconContainerVariantsFunction;
}

export type ExpansionPanelStyleStrategy = ThemeStrategy<ExpansionPanelVariantsFunctions>;

export interface ExpansionPanelBaseCompoundStyleOverride {
    readonly when: Partial<ExpansionPanelBaseVariantProps>;
    readonly class: ClassValue;
}

export interface ExpansionPanelBaseStyleOverrides {
    readonly base?: ClassValue;
    readonly rounded?: Partial<Record<NonNullable<ExpansionPanelBaseVariantProps["rounded"]>, ClassValue>>;
    readonly compoundVariants?: readonly ExpansionPanelBaseCompoundStyleOverride[];
}

export interface ExpansionPanelHeaderCompoundStyleOverride {
    readonly when: Partial<ExpansionPanelHeaderVariantProps>;
    readonly class: ClassValue;
}

export interface ExpansionPanelHeaderStyleOverrides {
    readonly base?: ClassValue;
    readonly collapsed?: Partial<Record<`${NonNullable<ExpansionPanelHeaderVariantProps["collapsed"]>}`, ClassValue>>;
    readonly disabled?: Partial<Record<`${NonNullable<ExpansionPanelHeaderVariantProps["disabled"]>}`, ClassValue>>;
    readonly compoundVariants?: readonly ExpansionPanelHeaderCompoundStyleOverride[];
}

export interface ExpansionPanelHeaderTitleStyleOverrides {
    readonly base?: ClassValue;
}

export interface ExpansionPanelIconContainerStyleOverrides {
    readonly base?: ClassValue;
    readonly hasTemplate?: Partial<
        Record<`${NonNullable<ExpansionPanelIconContainerVariantProps["hasTemplate"]>}`, ClassValue>
    >;
}

export interface ExpansionPanelContentCompoundStyleOverride {
    readonly when: Partial<ExpansionPanelContentVariantProps>;
    readonly class: ClassValue;
}

export interface ExpansionPanelContentStyleOverrides {
    readonly base?: ClassValue;
    readonly expanded?: Partial<Record<`${NonNullable<ExpansionPanelContentVariantProps["expanded"]>}`, ClassValue>>;
    readonly compoundVariants?: readonly ExpansionPanelContentCompoundStyleOverride[];
}

export interface ExpansionPanelStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly base?: ExpansionPanelBaseStyleOverrides;
    readonly content?: ExpansionPanelContentStyleOverrides;
    readonly header?: ExpansionPanelHeaderStyleOverrides;
    readonly headerTitle?: ExpansionPanelHeaderTitleStyleOverrides;
    readonly iconContainer?: ExpansionPanelIconContainerStyleOverrides;
}

export type ExpansionPanelStylesProviderConfig =
    | ExpansionPanelStyleOverrides
    | { readonly strategy: ExpansionPanelStyleStrategy };
