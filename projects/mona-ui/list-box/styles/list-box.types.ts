import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type {
    listBoxBaseVariants as monaListBoxBaseVariants,
    listBoxToolbarVariants as monaListBoxToolbarVariants
} from "./list-box.mona.styles";

export type ListBoxBaseVariantsFunction = (props?: ListBoxBaseVariantProps) => string;
export type ListBoxBaseVariantProps = VariantProps<typeof monaListBoxBaseVariants>;

export type ListBoxToolbarVariantsFunction = (props?: ListBoxToolbarVariantProps) => string;
export type ListBoxToolbarVariantProps = VariantProps<typeof monaListBoxToolbarVariants>;

export type ListBoxBaseVariantInput = Omit<VariantInputs<ListBoxBaseVariantProps>, "direction" | "reversed">;
export type ListBoxToolbarVariantInput = Omit<VariantInputs<ListBoxToolbarVariantProps>, "direction">;

export type ListBoxVariantProps = ListBoxBaseVariantProps & ListBoxToolbarVariantProps;
export type ListBoxVariantInputs = ListBoxBaseVariantInput & ListBoxToolbarVariantInput;

export interface ListBoxVariantsFunctions {
    readonly base: ListBoxBaseVariantsFunction;
    readonly toolbar: ListBoxToolbarVariantsFunction;
}

export type ListBoxStyleStrategy = ThemeStrategy<ListBoxVariantsFunctions>;

export interface ListBoxBaseCompoundStyleOverride {
    readonly when: Partial<ListBoxBaseVariantProps>;
    readonly class: ClassValue;
}

export interface ListBoxBaseStyleOverrides {
    readonly base?: ClassValue;
    readonly direction?: Partial<Record<NonNullable<ListBoxBaseVariantProps["direction"]>, ClassValue>>;
    readonly reversed?: Partial<Record<`${NonNullable<ListBoxBaseVariantProps["reversed"]>}`, ClassValue>>;
    readonly rounded?: Partial<Record<NonNullable<ListBoxBaseVariantProps["rounded"]>, ClassValue>>;
    readonly size?: Partial<Record<NonNullable<ListBoxBaseVariantProps["size"]>, ClassValue>>;
    readonly compoundVariants?: readonly ListBoxBaseCompoundStyleOverride[];
}

export interface ListBoxToolbarStyleOverrides {
    readonly base?: ClassValue;
    readonly direction?: Partial<Record<NonNullable<ListBoxToolbarVariantProps["direction"]>, ClassValue>>;
}

export interface ListBoxStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly base?: ListBoxBaseStyleOverrides;
    readonly toolbar?: ListBoxToolbarStyleOverrides;
}

export type ListBoxStylesProviderConfig = ListBoxStyleOverrides | { readonly strategy: ListBoxStyleStrategy };
