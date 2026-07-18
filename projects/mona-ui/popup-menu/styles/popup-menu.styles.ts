import { VariantProps } from "class-variance-authority";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import {
    popupMenuBaseVariants as annaPopupMenuBaseVariants,
    popupMenuContainerVariants as annaPopupMenuContainerVariants,
    popupMenuGroupHeaderVariants as annaPopupMenuGroupHeaderVariants,
    popupMenuIconContainerVariants as annaPopupMenuIconContainerVariants,
    popupMenuItemVariants as annaPopupMenuItemVariants,
    popupMenuLinkVariants as annaPopupMenuLinkVariants
} from "./popup-menu.anna.styles";
import {
    popupMenuBaseVariants as monaPopupMenuBaseVariants,
    popupMenuContainerVariants as monaPopupMenuContainerVariants,
    popupMenuGroupHeaderVariants as monaPopupMenuGroupHeaderVariants,
    popupMenuIconContainerVariants as monaPopupMenuIconContainerVariants,
    popupMenuItemVariants as monaPopupMenuItemVariants,
    popupMenuLinkVariants as monaPopupMenuLinkVariants
} from "./popup-menu.mona.styles";

export const popupMenuBaseThemeVariants = createThemeStrategy({
    anna: annaPopupMenuBaseVariants,
    mona: monaPopupMenuBaseVariants
});

export const popupMenuContainerThemeVariants = createThemeStrategy({
    anna: annaPopupMenuContainerVariants,
    mona: monaPopupMenuContainerVariants
});

export const popupMenuGroupHeaderThemeVariants = createThemeStrategy({
    anna: annaPopupMenuGroupHeaderVariants,
    mona: monaPopupMenuGroupHeaderVariants
});

export const popupMenuIconContainerThemeVariants = createThemeStrategy({
    anna: annaPopupMenuIconContainerVariants,
    mona: monaPopupMenuIconContainerVariants
});

export const popupMenuItemThemeVariants = createThemeStrategy({
    anna: annaPopupMenuItemVariants,
    mona: monaPopupMenuItemVariants
});

export const popupMenuLinkThemeVariants = createThemeStrategy({
    anna: annaPopupMenuLinkVariants,
    mona: monaPopupMenuLinkVariants
});

type PopupMenuBaseVariantProps = VariantProps<ReturnType<typeof popupMenuBaseThemeVariants>>;
type PopupMenuContainerVariantProps = VariantProps<ReturnType<typeof popupMenuContainerThemeVariants>>;
type PopupMenuGroupHeaderVariantProps = VariantProps<ReturnType<typeof popupMenuGroupHeaderThemeVariants>>;
type PopupMenuIconContainerVariantProps = VariantProps<ReturnType<typeof popupMenuIconContainerThemeVariants>>;
type PopupMenuItemVariantProps = VariantProps<ReturnType<typeof popupMenuItemThemeVariants>>;
type PopupMenuLinkVariantProps = VariantProps<ReturnType<typeof popupMenuLinkThemeVariants>>;

export type PopupMenuVariantProps = PopupMenuBaseVariantProps &
    PopupMenuContainerVariantProps &
    PopupMenuGroupHeaderVariantProps &
    PopupMenuIconContainerVariantProps &
    PopupMenuItemVariantProps &
    PopupMenuLinkVariantProps;
export type PopupMenuVariantInput = VariantInputs<PopupMenuVariantProps>;
