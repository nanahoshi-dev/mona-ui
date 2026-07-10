import { VariantProps } from "class-variance-authority";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import {
    popupMenuBaseVariants as monaPopupMenuBaseVariants,
    popupMenuContainerVariants as monaPopupMenuContainerVariants,
    popupMenuGroupHeaderVariants as monaPopupMenuGroupHeaderVariants,
    popupMenuIconContainerVariants as monaPopupMenuIconContainerVariants,
    popupMenuItemVariants as monaPopupMenuItemVariants,
    popupMenuLinkVariants as monaPopupMenuLinkVariants
} from "./popup-menu.mona.styles";

const popupMenuBaseThemeVariantsStrategy = createThemeStrategy(
    { mona: monaPopupMenuBaseVariants },
    monaPopupMenuBaseVariants
);

export const popupMenuBaseThemeVariants = (theme: ThemeStyle) => popupMenuBaseThemeVariantsStrategy.resolve(theme);

const popupMenuContainerThemeVariantsStrategy = createThemeStrategy(
    { mona: monaPopupMenuContainerVariants },
    monaPopupMenuContainerVariants
);

export const popupMenuContainerThemeVariants = (theme: ThemeStyle) =>
    popupMenuContainerThemeVariantsStrategy.resolve(theme);

const popupMenuGroupHeaderThemeVariantsStrategy = createThemeStrategy(
    { mona: monaPopupMenuGroupHeaderVariants },
    monaPopupMenuGroupHeaderVariants
);

export const popupMenuGroupHeaderThemeVariants = (theme: ThemeStyle) =>
    popupMenuGroupHeaderThemeVariantsStrategy.resolve(theme);

const popupMenuIconContainerThemeVariantsStrategy = createThemeStrategy(
    { mona: monaPopupMenuIconContainerVariants },
    monaPopupMenuIconContainerVariants
);

export const popupMenuIconContainerThemeVariants = (theme: ThemeStyle) =>
    popupMenuIconContainerThemeVariantsStrategy.resolve(theme);

const popupMenuItemThemeVariantsStrategy = createThemeStrategy(
    { mona: monaPopupMenuItemVariants },
    monaPopupMenuItemVariants
);

export const popupMenuItemThemeVariants = (theme: ThemeStyle) => popupMenuItemThemeVariantsStrategy.resolve(theme);

const popupMenuLinkThemeVariantsStrategy = createThemeStrategy(
    { mona: monaPopupMenuLinkVariants },
    monaPopupMenuLinkVariants
);

export const popupMenuLinkThemeVariants = (theme: ThemeStyle) => popupMenuLinkThemeVariantsStrategy.resolve(theme);

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
