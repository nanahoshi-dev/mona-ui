import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type { listViewBaseVariants as monaListViewBaseVariants } from "./list-view.mona.styles";

export type ListViewBaseVariantsFunction = (props?: ListViewBaseVariantProps) => string;
export type ListViewBaseVariantProps = VariantProps<typeof monaListViewBaseVariants>;

export type ListViewBaseVariantInput = VariantInputs<ListViewBaseVariantProps>;

export type ListViewVariantProps = ListViewBaseVariantProps;
export type ListViewVariantInputs = ListViewBaseVariantInput;

export interface ListViewVariantsFunctions {
    readonly base: ListViewBaseVariantsFunction;
}

export type ListViewStyleStrategy = ThemeStrategy<ListViewVariantsFunctions>;

export interface ListViewBaseStyleOverrides {
    readonly base?: ClassValue;
    readonly rounded?: Partial<Record<NonNullable<ListViewBaseVariantProps["rounded"]>, ClassValue>>;
    readonly size?: Partial<Record<NonNullable<ListViewBaseVariantProps["size"]>, ClassValue>>;
}

export interface ListViewStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly base?: ListViewBaseStyleOverrides;
}

export type ListViewStylesProviderConfig = ListViewStyleOverrides | { readonly strategy: ListViewStyleStrategy };
