import { type ThemeStyle, createInheritedThemeStrategy } from "@nanahoshi/mona-ui/theme";
import { monaPopupAnimation } from "./popup.mona.styles";
import { reinaPopupAnimation } from "./popup.reina.styles";
import { resolvePopupAnimation } from "./popup.style-composition";
import type { PopupAnimationConfig, PopupAnimationStrategy, PopupStyleOverrides } from "./popup.types";

const defaultPopupAnimationStrategy = createInheritedThemeStrategy<PopupAnimationConfig>(monaPopupAnimation, {
    reina: reinaPopupAnimation
});

export const popupThemeAnimation = (theme: ThemeStyle): PopupAnimationConfig =>
    defaultPopupAnimationStrategy.resolve(theme);

export function createPopupStyleStrategy(overrides: readonly PopupStyleOverrides[] = []): PopupAnimationStrategy {
    return createInheritedThemeStrategy<PopupAnimationConfig>(
        resolvePopupAnimation(monaPopupAnimation, overrides, "mona"),
        { reina: resolvePopupAnimation(reinaPopupAnimation, overrides, "reina") }
    );
}
