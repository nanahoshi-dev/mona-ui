import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    dialogBaseVariants as annaDialogBaseVariants,
    dialogBodyVariants as annaDialogBodyVariants,
    dialogCloseButtonContainerVariants as annaDialogCloseButtonContainerVariants,
    dialogContentContainerVariants as annaDialogContentContainerVariants,
    dialogContentVariants as annaDialogContentVariants,
    dialogDescriptionVariants as annaDialogDescriptionVariants,
    dialogFooterVariants as annaDialogFooterVariants,
    dialogHeaderVariants as annaDialogHeaderVariants,
    dialogIconContainerVariants as annaDialogIconContainerVariants,
    dialogIconVariants as annaDialogIconVariants,
    dialogTitleContainerVariants as annaDialogTitleContainerVariants,
    dialogTitleVariants as annaDialogTitleVariants
} from "./dialog.anna.styles";
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

export const dialogBaseThemeVariants = createThemeStrategy({
    anna: annaDialogBaseVariants,
    mona: monaDialogBaseVariants
});

export const dialogIconThemeVariants = createThemeStrategy({
    anna: annaDialogIconVariants,
    mona: monaDialogIconVariants
});

export const dialogBodyThemeVariants = createThemeStrategy({
    anna: annaDialogBodyVariants,
    mona: monaDialogBodyVariants
});

export const dialogContentContainerThemeVariants = createThemeStrategy({
    anna: annaDialogContentContainerVariants,
    mona: monaDialogContentContainerVariants
});

export const dialogHeaderThemeVariants = createThemeStrategy({
    anna: annaDialogHeaderVariants,
    mona: monaDialogHeaderVariants
});

export const dialogIconContainerThemeVariants = createThemeStrategy({
    anna: annaDialogIconContainerVariants,
    mona: monaDialogIconContainerVariants
});

export const dialogTitleContainerThemeVariants = createThemeStrategy({
    anna: annaDialogTitleContainerVariants,
    mona: monaDialogTitleContainerVariants
});

export const dialogCloseButtonContainerThemeVariants = createThemeStrategy({
    anna: annaDialogCloseButtonContainerVariants,
    mona: monaDialogCloseButtonContainerVariants
});

export const dialogTitleThemeVariants = createThemeStrategy({
    anna: annaDialogTitleVariants,
    mona: monaDialogTitleVariants
});

export const dialogDescriptionThemeVariants = createThemeStrategy({
    anna: annaDialogDescriptionVariants,
    mona: monaDialogDescriptionVariants
});

export const dialogContentThemeVariants = createThemeStrategy({
    anna: annaDialogContentVariants,
    mona: monaDialogContentVariants
});

export const dialogFooterThemeVariants = createThemeStrategy({
    anna: annaDialogFooterVariants,
    mona: monaDialogFooterVariants
});

type DialogBaseVariantProps = VariantProps<ReturnType<typeof dialogBaseThemeVariants>>;
type DialogBaseVariantInput = VariantInputs<DialogBaseVariantProps>;

type DialogIconContainerVariantProps = VariantProps<ReturnType<typeof dialogIconContainerThemeVariants>>;
type DialogIconContainerVariantInput = VariantInputs<DialogIconContainerVariantProps>;

export type DialogIconVariantProps = VariantProps<ReturnType<typeof dialogIconThemeVariants>>;
type DialogIconVariantInput = VariantInputs<DialogIconVariantProps>;

export type DialogVariantProps = DialogBaseVariantProps & DialogIconContainerVariantProps & DialogIconVariantProps;
export type DialogVariantInput = DialogBaseVariantInput & DialogIconContainerVariantInput & DialogIconVariantInput;
