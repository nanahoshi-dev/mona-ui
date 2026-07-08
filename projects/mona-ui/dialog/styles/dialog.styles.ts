import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "@mirei/mona-ui/theme";
import { VariantInputs } from "@mirei/mona-ui/internal";
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

export const dialogBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaDialogBaseVariants;
        default:
            return monaDialogBaseVariants;
    }
};

export const dialogIconThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaDialogIconVariants;
        default:
            return monaDialogIconVariants;
    }
};

export const dialogBodyThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaDialogBodyVariants;
        default:
            return monaDialogBodyVariants;
    }
};

export const dialogContentContainerThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaDialogContentContainerVariants;
        default:
            return monaDialogContentContainerVariants;
    }
};

export const dialogHeaderThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaDialogHeaderVariants;
        default:
            return monaDialogHeaderVariants;
    }
};

export const dialogIconContainerThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaDialogIconContainerVariants;
        default:
            return monaDialogIconContainerVariants;
    }
};

export const dialogTitleContainerThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaDialogTitleContainerVariants;
        default:
            return monaDialogTitleContainerVariants;
    }
};

export const dialogCloseButtonContainerThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaDialogCloseButtonContainerVariants;
        default:
            return monaDialogCloseButtonContainerVariants;
    }
};

export const dialogTitleThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaDialogTitleVariants;
        default:
            return monaDialogTitleVariants;
    }
};

export const dialogDescriptionThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaDialogDescriptionVariants;
        default:
            return monaDialogDescriptionVariants;
    }
};

export const dialogContentThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaDialogContentVariants;
        default:
            return monaDialogContentVariants;
    }
};

export const dialogFooterThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaDialogFooterVariants;
        default:
            return monaDialogFooterVariants;
    }
};

type DialogBaseVariantProps = VariantProps<ReturnType<typeof dialogBaseThemeVariants>>;
type DialogBaseVariantInput = VariantInputs<DialogBaseVariantProps>;

type DialogIconContainerVariantProps = VariantProps<ReturnType<typeof dialogIconContainerThemeVariants>>;
type DialogIconContainerVariantInput = VariantInputs<DialogIconContainerVariantProps>;

export type DialogIconVariantProps = VariantProps<ReturnType<typeof dialogIconThemeVariants>>;
type DialogIconVariantInput = VariantInputs<DialogIconVariantProps>;

export type DialogVariantProps = DialogBaseVariantProps & DialogIconContainerVariantProps & DialogIconVariantProps;
export type DialogVariantInput = DialogBaseVariantInput & DialogIconContainerVariantInput & DialogIconVariantInput;
