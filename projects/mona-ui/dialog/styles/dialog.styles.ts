import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    dialogBaseVariants as monaDialogBaseVariants,
    dialogBodyVariants as monaDialogBodyVariants,
    dialogCloseButtonContainerVariants as monaDialogCloseButtonContainerVariants,
    dialogContentContainerVariants as monaDialogContentContainerVariants,
    dialogContentVariants as monaDialogContentVariants,
    dialogDescriptionVariants as monaDialogDescriptionVariants,
    dialogFooterVariants as monaDialogFooterVariants,
    dialogHeaderVariants as monaDialogHeaderVariants,
    dialogIconContainerVariants as monaDialogIconContainerVariants,
    dialogIconVariants as monaDialogIconVariants,
    dialogTitleContainerVariants as monaDialogTitleContainerVariants,
    dialogTitleVariants as monaDialogTitleVariants
} from "./dialog.mona.styles";

const dialogBaseThemeVariantsStrategy = createThemeStrategy({ mona: monaDialogBaseVariants }, monaDialogBaseVariants);

export const dialogBaseThemeVariants = (theme: ThemeStyle) => dialogBaseThemeVariantsStrategy.resolve(theme);

const dialogIconThemeVariantsStrategy = createThemeStrategy({ mona: monaDialogIconVariants }, monaDialogIconVariants);

export const dialogIconThemeVariants = (theme: ThemeStyle) => dialogIconThemeVariantsStrategy.resolve(theme);

const dialogBodyThemeVariantsStrategy = createThemeStrategy({ mona: monaDialogBodyVariants }, monaDialogBodyVariants);

export const dialogBodyThemeVariants = (theme: ThemeStyle) => dialogBodyThemeVariantsStrategy.resolve(theme);

const dialogContentContainerThemeVariantsStrategy = createThemeStrategy(
    { mona: monaDialogContentContainerVariants },
    monaDialogContentContainerVariants
);

export const dialogContentContainerThemeVariants = (theme: ThemeStyle) =>
    dialogContentContainerThemeVariantsStrategy.resolve(theme);

const dialogHeaderThemeVariantsStrategy = createThemeStrategy(
    { mona: monaDialogHeaderVariants },
    monaDialogHeaderVariants
);

export const dialogHeaderThemeVariants = (theme: ThemeStyle) => dialogHeaderThemeVariantsStrategy.resolve(theme);

const dialogIconContainerThemeVariantsStrategy = createThemeStrategy(
    { mona: monaDialogIconContainerVariants },
    monaDialogIconContainerVariants
);

export const dialogIconContainerThemeVariants = (theme: ThemeStyle) =>
    dialogIconContainerThemeVariantsStrategy.resolve(theme);

const dialogTitleContainerThemeVariantsStrategy = createThemeStrategy(
    { mona: monaDialogTitleContainerVariants },
    monaDialogTitleContainerVariants
);

export const dialogTitleContainerThemeVariants = (theme: ThemeStyle) =>
    dialogTitleContainerThemeVariantsStrategy.resolve(theme);

const dialogCloseButtonContainerThemeVariantsStrategy = createThemeStrategy(
    { mona: monaDialogCloseButtonContainerVariants },
    monaDialogCloseButtonContainerVariants
);

export const dialogCloseButtonContainerThemeVariants = (theme: ThemeStyle) =>
    dialogCloseButtonContainerThemeVariantsStrategy.resolve(theme);

const dialogTitleThemeVariantsStrategy = createThemeStrategy(
    { mona: monaDialogTitleVariants },
    monaDialogTitleVariants
);

export const dialogTitleThemeVariants = (theme: ThemeStyle) => dialogTitleThemeVariantsStrategy.resolve(theme);

const dialogDescriptionThemeVariantsStrategy = createThemeStrategy(
    { mona: monaDialogDescriptionVariants },
    monaDialogDescriptionVariants
);

export const dialogDescriptionThemeVariants = (theme: ThemeStyle) =>
    dialogDescriptionThemeVariantsStrategy.resolve(theme);

const dialogContentThemeVariantsStrategy = createThemeStrategy(
    { mona: monaDialogContentVariants },
    monaDialogContentVariants
);

export const dialogContentThemeVariants = (theme: ThemeStyle) => dialogContentThemeVariantsStrategy.resolve(theme);

const dialogFooterThemeVariantsStrategy = createThemeStrategy(
    { mona: monaDialogFooterVariants },
    monaDialogFooterVariants
);

export const dialogFooterThemeVariants = (theme: ThemeStyle) => dialogFooterThemeVariantsStrategy.resolve(theme);

type DialogBaseVariantProps = VariantProps<ReturnType<typeof dialogBaseThemeVariants>>;
type DialogBaseVariantInput = VariantInputs<DialogBaseVariantProps>;

type DialogIconContainerVariantProps = VariantProps<ReturnType<typeof dialogIconContainerThemeVariants>>;
type DialogIconContainerVariantInput = VariantInputs<DialogIconContainerVariantProps>;

export type DialogIconVariantProps = VariantProps<ReturnType<typeof dialogIconThemeVariants>>;
type DialogIconVariantInput = VariantInputs<DialogIconVariantProps>;

export type DialogVariantProps = DialogBaseVariantProps & DialogIconContainerVariantProps & DialogIconVariantProps;
export type DialogVariantInput = DialogBaseVariantInput & DialogIconContainerVariantInput & DialogIconVariantInput;
