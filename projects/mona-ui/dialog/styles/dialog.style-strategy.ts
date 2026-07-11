import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
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
import {
    reinaDialogBaseVariants,
    reinaDialogBodyVariants,
    reinaDialogCloseButtonContainerVariants,
    reinaDialogContentContainerVariants,
    reinaDialogContentVariants,
    reinaDialogDescriptionVariants,
    reinaDialogFooterVariants,
    reinaDialogHeaderVariants,
    reinaDialogIconContainerVariants,
    reinaDialogIconVariants,
    reinaDialogTitleContainerVariants,
    reinaDialogTitleVariants
} from "./dialog.reina.styles";
import {
    createDialogBaseVariants,
    createDialogBodyVariants,
    createDialogCloseButtonContainerVariants,
    createDialogContentContainerVariants,
    createDialogContentVariants,
    createDialogDescriptionVariants,
    createDialogFooterVariants,
    createDialogHeaderVariants,
    createDialogIconContainerVariants,
    createDialogIconVariants,
    createDialogTitleContainerVariants,
    createDialogTitleVariants
} from "./dialog.style-composition";
import type {
    DialogBaseVariantsFunction,
    DialogBodyVariantsFunction,
    DialogCloseButtonContainerVariantsFunction,
    DialogContentContainerVariantsFunction,
    DialogContentVariantsFunction,
    DialogDescriptionVariantsFunction,
    DialogFooterVariantsFunction,
    DialogHeaderVariantsFunction,
    DialogIconContainerVariantsFunction,
    DialogIconVariantsFunction,
    DialogStyleOverrides,
    DialogStyleStrategy,
    DialogTitleContainerVariantsFunction,
    DialogTitleVariantsFunction,
    DialogVariantsFunctions
} from "./dialog.types";

const defaultDialogBaseStrategy = createThemeStrategy<DialogBaseVariantsFunction>(
    { mona: monaDialogBaseVariants, reina: reinaDialogBaseVariants },
    monaDialogBaseVariants
);
const defaultDialogIconStrategy = createThemeStrategy<DialogIconVariantsFunction>(
    { mona: monaDialogIconVariants, reina: reinaDialogIconVariants },
    monaDialogIconVariants
);
const defaultDialogBodyStrategy = createThemeStrategy<DialogBodyVariantsFunction>(
    { mona: monaDialogBodyVariants, reina: reinaDialogBodyVariants },
    monaDialogBodyVariants
);
const defaultDialogContentContainerStrategy = createThemeStrategy<DialogContentContainerVariantsFunction>(
    { mona: monaDialogContentContainerVariants, reina: reinaDialogContentContainerVariants },
    monaDialogContentContainerVariants
);
const defaultDialogHeaderStrategy = createThemeStrategy<DialogHeaderVariantsFunction>(
    { mona: monaDialogHeaderVariants, reina: reinaDialogHeaderVariants },
    monaDialogHeaderVariants
);
const defaultDialogIconContainerStrategy = createThemeStrategy<DialogIconContainerVariantsFunction>(
    { mona: monaDialogIconContainerVariants, reina: reinaDialogIconContainerVariants },
    monaDialogIconContainerVariants
);
const defaultDialogTitleContainerStrategy = createThemeStrategy<DialogTitleContainerVariantsFunction>(
    { mona: monaDialogTitleContainerVariants, reina: reinaDialogTitleContainerVariants },
    monaDialogTitleContainerVariants
);
const defaultDialogCloseButtonContainerStrategy = createThemeStrategy<DialogCloseButtonContainerVariantsFunction>(
    { mona: monaDialogCloseButtonContainerVariants, reina: reinaDialogCloseButtonContainerVariants },
    monaDialogCloseButtonContainerVariants
);
const defaultDialogTitleStrategy = createThemeStrategy<DialogTitleVariantsFunction>(
    { mona: monaDialogTitleVariants, reina: reinaDialogTitleVariants },
    monaDialogTitleVariants
);
const defaultDialogDescriptionStrategy = createThemeStrategy<DialogDescriptionVariantsFunction>(
    { mona: monaDialogDescriptionVariants, reina: reinaDialogDescriptionVariants },
    monaDialogDescriptionVariants
);
const defaultDialogContentStrategy = createThemeStrategy<DialogContentVariantsFunction>(
    { mona: monaDialogContentVariants, reina: reinaDialogContentVariants },
    monaDialogContentVariants
);
const defaultDialogFooterStrategy = createThemeStrategy<DialogFooterVariantsFunction>(
    { mona: monaDialogFooterVariants, reina: reinaDialogFooterVariants },
    monaDialogFooterVariants
);

export const dialogBaseThemeVariants = (theme: ThemeStyle): DialogBaseVariantsFunction =>
    defaultDialogBaseStrategy.resolve(theme);
export const dialogIconThemeVariants = (theme: ThemeStyle): DialogIconVariantsFunction =>
    defaultDialogIconStrategy.resolve(theme);
export const dialogBodyThemeVariants = (theme: ThemeStyle): DialogBodyVariantsFunction =>
    defaultDialogBodyStrategy.resolve(theme);
export const dialogContentContainerThemeVariants = (theme: ThemeStyle): DialogContentContainerVariantsFunction =>
    defaultDialogContentContainerStrategy.resolve(theme);
export const dialogHeaderThemeVariants = (theme: ThemeStyle): DialogHeaderVariantsFunction =>
    defaultDialogHeaderStrategy.resolve(theme);
export const dialogIconContainerThemeVariants = (theme: ThemeStyle): DialogIconContainerVariantsFunction =>
    defaultDialogIconContainerStrategy.resolve(theme);
export const dialogTitleContainerThemeVariants = (theme: ThemeStyle): DialogTitleContainerVariantsFunction =>
    defaultDialogTitleContainerStrategy.resolve(theme);
export const dialogCloseButtonContainerThemeVariants = (theme: ThemeStyle): DialogCloseButtonContainerVariantsFunction =>
    defaultDialogCloseButtonContainerStrategy.resolve(theme);
export const dialogTitleThemeVariants = (theme: ThemeStyle): DialogTitleVariantsFunction =>
    defaultDialogTitleStrategy.resolve(theme);
export const dialogDescriptionThemeVariants = (theme: ThemeStyle): DialogDescriptionVariantsFunction =>
    defaultDialogDescriptionStrategy.resolve(theme);
export const dialogContentThemeVariants = (theme: ThemeStyle): DialogContentVariantsFunction =>
    defaultDialogContentStrategy.resolve(theme);
export const dialogFooterThemeVariants = (theme: ThemeStyle): DialogFooterVariantsFunction =>
    defaultDialogFooterStrategy.resolve(theme);

export function createDialogStyleStrategy(overrides: readonly DialogStyleOverrides[] = []): DialogStyleStrategy {
    const mona: DialogVariantsFunctions = {
        base: createDialogBaseVariants(monaDialogBaseVariants, overrides, "mona"),
        body: createDialogBodyVariants(monaDialogBodyVariants, overrides, "mona"),
        closeButtonContainer: createDialogCloseButtonContainerVariants(
            monaDialogCloseButtonContainerVariants,
            overrides,
            "mona"
        ),
        content: createDialogContentVariants(monaDialogContentVariants, overrides, "mona"),
        contentContainer: createDialogContentContainerVariants(monaDialogContentContainerVariants, overrides, "mona"),
        description: createDialogDescriptionVariants(monaDialogDescriptionVariants, overrides, "mona"),
        footer: createDialogFooterVariants(monaDialogFooterVariants, overrides, "mona"),
        header: createDialogHeaderVariants(monaDialogHeaderVariants, overrides, "mona"),
        icon: createDialogIconVariants(monaDialogIconVariants, overrides, "mona"),
        iconContainer: createDialogIconContainerVariants(monaDialogIconContainerVariants, overrides, "mona"),
        title: createDialogTitleVariants(monaDialogTitleVariants, overrides, "mona"),
        titleContainer: createDialogTitleContainerVariants(monaDialogTitleContainerVariants, overrides, "mona")
    };
    const reina: DialogVariantsFunctions = {
        base: createDialogBaseVariants(reinaDialogBaseVariants, overrides, "reina"),
        body: createDialogBodyVariants(reinaDialogBodyVariants, overrides, "reina"),
        closeButtonContainer: createDialogCloseButtonContainerVariants(
            reinaDialogCloseButtonContainerVariants,
            overrides,
            "reina"
        ),
        content: createDialogContentVariants(reinaDialogContentVariants, overrides, "reina"),
        contentContainer: createDialogContentContainerVariants(reinaDialogContentContainerVariants, overrides, "reina"),
        description: createDialogDescriptionVariants(reinaDialogDescriptionVariants, overrides, "reina"),
        footer: createDialogFooterVariants(reinaDialogFooterVariants, overrides, "reina"),
        header: createDialogHeaderVariants(reinaDialogHeaderVariants, overrides, "reina"),
        icon: createDialogIconVariants(reinaDialogIconVariants, overrides, "reina"),
        iconContainer: createDialogIconContainerVariants(reinaDialogIconContainerVariants, overrides, "reina"),
        title: createDialogTitleVariants(reinaDialogTitleVariants, overrides, "reina"),
        titleContainer: createDialogTitleContainerVariants(reinaDialogTitleContainerVariants, overrides, "reina")
    };
    return createThemeStrategy<DialogVariantsFunctions>({ mona, reina }, mona);
}
