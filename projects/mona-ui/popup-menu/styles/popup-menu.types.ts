import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type {
    popupMenuBaseVariants as monaPopupMenuBaseVariants,
    popupMenuContainerVariants as monaPopupMenuContainerVariants,
    popupMenuGroupHeaderVariants as monaPopupMenuGroupHeaderVariants,
    popupMenuItemVariants as monaPopupMenuItemVariants
} from "./popup-menu.mona.styles";

export type PopupMenuBaseVariantProps = VariantProps<typeof monaPopupMenuBaseVariants>;
export type PopupMenuContainerVariantProps = VariantProps<typeof monaPopupMenuContainerVariants>;
export type PopupMenuGroupHeaderVariantProps = VariantProps<typeof monaPopupMenuGroupHeaderVariants>;
export type PopupMenuItemVariantProps = VariantProps<typeof monaPopupMenuItemVariants>;

export type PopupMenuVariantProps = PopupMenuBaseVariantProps &
    PopupMenuContainerVariantProps &
    PopupMenuGroupHeaderVariantProps &
    PopupMenuItemVariantProps;
export type PopupMenuVariantInput = VariantInputs<PopupMenuVariantProps>;

export interface PopupMenuBaseStyleOverride {
    readonly root?: ClassValue;
    readonly rounded?: Partial<Record<NonNullable<PopupMenuBaseVariantProps["rounded"]>, ClassValue>>;
}

export type PopupMenuContainerStyleOverride = PopupMenuBaseStyleOverride;

export interface PopupMenuGroupHeaderStyleOverride {
    readonly root?: ClassValue;
    readonly size?: Partial<Record<NonNullable<PopupMenuGroupHeaderVariantProps["size"]>, ClassValue>>;
}

export interface PopupMenuIconContainerStyleOverride {
    readonly root?: ClassValue;
}

export interface PopupMenuItemStyleOverride {
    readonly root?: ClassValue;
    readonly rounded?: Partial<Record<NonNullable<PopupMenuItemVariantProps["rounded"]>, ClassValue>>;
    readonly size?: Partial<Record<NonNullable<PopupMenuItemVariantProps["size"]>, ClassValue>>;
}

export type PopupMenuLinkStyleOverride = PopupMenuIconContainerStyleOverride;

export interface PopupMenuStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly base?: PopupMenuBaseStyleOverride;
    readonly container?: PopupMenuContainerStyleOverride;
    readonly groupHeader?: PopupMenuGroupHeaderStyleOverride;
    readonly iconContainer?: PopupMenuIconContainerStyleOverride;
    readonly item?: PopupMenuItemStyleOverride;
    readonly link?: PopupMenuLinkStyleOverride;
}

export interface PopupMenuVariantsBundle {
    readonly base: (props?: PopupMenuBaseVariantProps) => string;
    readonly container: (props?: PopupMenuContainerVariantProps) => string;
    readonly groupHeader: (props?: PopupMenuGroupHeaderVariantProps) => string;
    readonly iconContainer: () => string;
    readonly item: (props?: PopupMenuItemVariantProps) => string;
    readonly link: () => string;
}

export type PopupMenuStyleStrategy = ThemeStrategy<PopupMenuVariantsBundle>;
export type PopupMenuStylesProviderConfig =
    | PopupMenuStyleOverrides
    | { readonly strategy: PopupMenuStyleStrategy };
