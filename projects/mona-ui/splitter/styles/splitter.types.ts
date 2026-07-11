import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type {
    splitterBaseVariants as monaSplitterBaseVariants,
    splitterResizerHandleVariants as monaSplitterResizerHandleVariants,
    splitterResizerVariants as monaSplitterResizerVariants
} from "./splitter.mona.styles";

export type SplitterBaseVariantsFunction = (props?: SplitterBaseVariantProps) => string;
export type SplitterBaseVariantProps = VariantProps<typeof monaSplitterBaseVariants>;

export type SplitterResizerVariantsFunction = (props?: SplitterResizerVariantProps) => string;
export type SplitterResizerVariantProps = VariantProps<typeof monaSplitterResizerVariants>;

export type SplitterResizerHandleVariantsFunction = (props?: SplitterResizerHandleVariantProps) => string;
export type SplitterResizerHandleVariantProps = VariantProps<typeof monaSplitterResizerHandleVariants>;

export type SplitterBaseVariantInput = VariantInputs<SplitterBaseVariantProps>;
export type SplitterResizerVariantInput = VariantInputs<SplitterResizerVariantProps>;
export type SplitterResizerHandleVariantInput = VariantInputs<SplitterResizerHandleVariantProps>;

export type SplitterVariantProps = SplitterBaseVariantProps &
    SplitterResizerVariantProps &
    SplitterResizerHandleVariantProps;

export type SplitterVariantInput = SplitterBaseVariantInput &
    Omit<SplitterResizerVariantInput, "resizing"> &
    SplitterResizerHandleVariantInput;

export interface SplitterVariantsFunctions {
    readonly base: SplitterBaseVariantsFunction;
    readonly resizer: SplitterResizerVariantsFunction;
    readonly resizerHandle: SplitterResizerHandleVariantsFunction;
}

export type SplitterStyleStrategy = ThemeStrategy<SplitterVariantsFunctions>;

export interface SplitterBaseCompoundStyleOverride {
    readonly when: Partial<SplitterBaseVariantProps>;
    readonly class: ClassValue;
}

export interface SplitterBaseStyleOverrides {
    readonly base?: ClassValue;
    readonly orientation?: Partial<Record<NonNullable<SplitterBaseVariantProps["orientation"]>, ClassValue>>;
    readonly compoundVariants?: readonly SplitterBaseCompoundStyleOverride[];
}

export interface SplitterResizerCompoundStyleOverride {
    readonly when: Partial<SplitterResizerVariantProps>;
    readonly class: ClassValue;
}

export interface SplitterResizerStyleOverrides {
    readonly base?: ClassValue;
    readonly orientation?: Partial<Record<NonNullable<SplitterResizerVariantProps["orientation"]>, ClassValue>>;
    readonly resizing?: Partial<Record<`${NonNullable<SplitterResizerVariantProps["resizing"]>}`, ClassValue>>;
    readonly compoundVariants?: readonly SplitterResizerCompoundStyleOverride[];
}

export interface SplitterResizerHandleCompoundStyleOverride {
    readonly when: Partial<SplitterResizerHandleVariantProps>;
    readonly class: ClassValue;
}

export interface SplitterResizerHandleStyleOverrides {
    readonly base?: ClassValue;
    readonly orientation?: Partial<
        Record<NonNullable<SplitterResizerHandleVariantProps["orientation"]>, ClassValue>
    >;
    readonly compoundVariants?: readonly SplitterResizerHandleCompoundStyleOverride[];
}

export interface SplitterStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly base?: SplitterBaseStyleOverrides;
    readonly resizer?: SplitterResizerStyleOverrides;
    readonly resizerHandle?: SplitterResizerHandleStyleOverrides;
}

export type SplitterStylesProviderConfig = SplitterStyleOverrides | { readonly strategy: SplitterStyleStrategy };
