import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type {
    menubarBaseVariants as monaMenubarBaseVariants,
    menubarListItemVariants as monaMenubarListItemVariants,
    menubarListVariants as monaMenubarListVariants
} from "./menu.mona.styles";

export type MenubarBaseVariantsFunction = (props?: MenubarBaseVariantProps) => string;
export type MenubarBaseVariantProps = VariantProps<typeof monaMenubarBaseVariants>;

export type MenubarListVariantsFunction = (props?: MenubarListVariantProps) => string;
export type MenubarListVariantProps = VariantProps<typeof monaMenubarListVariants>;

export type MenubarListItemVariantsFunction = (props?: MenubarListItemVariantProps) => string;
export type MenubarListItemVariantProps = VariantProps<typeof monaMenubarListItemVariants>;

export type MenubarBaseVariantInput = VariantInputs<MenubarBaseVariantProps>;
export type MenubarListVariantInput = VariantInputs<MenubarListVariantProps>;
export type MenubarListItemVariantInput = VariantInputs<MenubarListItemVariantProps>;

export type MenubarVariantProps = MenubarBaseVariantProps & MenubarListItemVariantProps & MenubarListVariantProps;
export type MenubarVariantInput = VariantInputs<MenubarVariantProps>;

export interface MenubarVariantsFunctions {
    readonly base: MenubarBaseVariantsFunction;
    readonly list: MenubarListVariantsFunction;
    readonly listItem: MenubarListItemVariantsFunction;
}

export type MenubarStyleStrategy = ThemeStrategy<MenubarVariantsFunctions>;

export interface MenubarBaseStyleOverrides {
    readonly base?: ClassValue;
    readonly rounded?: Partial<Record<NonNullable<MenubarBaseVariantProps["rounded"]>, ClassValue>>;
    readonly size?: Partial<Record<NonNullable<MenubarBaseVariantProps["size"]>, ClassValue>>;
}

export interface MenubarListStyleOverrides {
    readonly base?: ClassValue;
}

export interface MenubarListItemStyleOverrides {
    readonly base?: ClassValue;
    readonly rounded?: Partial<Record<NonNullable<MenubarListItemVariantProps["rounded"]>, ClassValue>>;
}

export interface MenubarStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly base?: MenubarBaseStyleOverrides;
    readonly list?: MenubarListStyleOverrides;
    readonly listItem?: MenubarListItemStyleOverrides;
}

export type MenubarStylesProviderConfig = MenubarStyleOverrides | { readonly strategy: MenubarStyleStrategy };
