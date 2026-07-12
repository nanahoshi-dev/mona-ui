import { type ThemeStyle, createInheritedThemeStrategy } from "@nanahoshi/mona-ui/theme";
import { createMonaPopupMenuVariants, createReinaPopupMenuVariants } from "./popup-menu.style-composition";
import type { PopupMenuStyleOverrides, PopupMenuStyleStrategy, PopupMenuVariantsBundle } from "./popup-menu.types";

const defaultPopupMenuStrategy = createInheritedThemeStrategy<PopupMenuVariantsBundle>(
    createMonaPopupMenuVariants([], "mona"),
    { reina: createReinaPopupMenuVariants([], "reina") }
);

export const popupMenuThemeVariants = (theme: ThemeStyle): PopupMenuVariantsBundle =>
    defaultPopupMenuStrategy.resolve(theme);

export function createPopupMenuStyleStrategy(
    overrides: readonly PopupMenuStyleOverrides[] = []
): PopupMenuStyleStrategy {
    const mona = createMonaPopupMenuVariants(overrides, "mona");
    const reina = createReinaPopupMenuVariants(overrides, "reina");
    return createInheritedThemeStrategy<PopupMenuVariantsBundle>(mona, { reina: reina });
}
