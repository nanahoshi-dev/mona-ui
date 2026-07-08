import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "@mirei/mona-ui/theme";
import { VariantInputs } from "@mirei/mona-ui/common";
import {
    popupMenuBaseVariants as monaPopupMenuBaseVariants,
    popupMenuContainerVariants as monaPopupMenuContainerVariants,
    popupMenuGroupHeaderVariants as monaPopupMenuGroupHeaderVariants,
    popupMenuIconContainerVariants as monaPopupMenuIconContainerVariants,
    popupMenuItemVariants as monaPopupMenuItemVariants,
    popupMenuLinkVariants as monaPopupMenuLinkVariants
} from "./popup-menu.mona.styles";

export const popupMenuBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaPopupMenuBaseVariants;
        default:
            return monaPopupMenuBaseVariants;
    }
};

export const popupMenuContainerThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaPopupMenuContainerVariants;
        default:
            return monaPopupMenuContainerVariants;
    }
};

export const popupMenuGroupHeaderThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaPopupMenuGroupHeaderVariants;
        default:
            return monaPopupMenuGroupHeaderVariants;
    }
};

export const popupMenuIconContainerThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaPopupMenuIconContainerVariants;
        default:
            return monaPopupMenuIconContainerVariants;
    }
};

export const popupMenuItemThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaPopupMenuItemVariants;
        default:
            return monaPopupMenuItemVariants;
    }
};

export const popupMenuLinkThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaPopupMenuLinkVariants;
        default:
            return monaPopupMenuLinkVariants;
    }
};

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
