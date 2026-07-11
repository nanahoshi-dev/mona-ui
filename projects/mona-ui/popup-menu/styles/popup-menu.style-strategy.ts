import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { createMonaPopupMenuVariants, createReinaPopupMenuVariants } from "./popup-menu.style-composition";
import type { PopupMenuStyleOverrides, PopupMenuStyleStrategy, PopupMenuVariantsBundle } from "./popup-menu.types";

const defaultPopupMenuStrategy = createThemeStrategy<PopupMenuVariantsBundle>(
    {
        mona: createMonaPopupMenuVariants([], "mona"),
        reina: createReinaPopupMenuVariants([], "reina")
    },
    createMonaPopupMenuVariants([], "mona")
);

export const popupMenuThemeVariants = (theme: ThemeStyle): PopupMenuVariantsBundle =>
    defaultPopupMenuStrategy.resolve(theme);

export function createPopupMenuStyleStrategy(
    overrides: readonly PopupMenuStyleOverrides[] = []
): PopupMenuStyleStrategy {
    const mona = createMonaPopupMenuVariants(overrides, "mona");
    const reina = createReinaPopupMenuVariants(overrides, "reina");
    return createThemeStrategy<PopupMenuVariantsBundle>({ mona, reina }, mona);
}
