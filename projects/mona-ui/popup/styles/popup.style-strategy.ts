import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { monaPopupAnimation } from "./popup.mona.styles";
import { reinaPopupAnimation } from "./popup.reina.styles";
import { resolvePopupAnimation } from "./popup.style-composition";
import type { PopupAnimationConfig, PopupAnimationStrategy, PopupStyleOverrides } from "./popup.types";

const defaultPopupAnimationStrategy = createThemeStrategy<PopupAnimationConfig>(
    { mona: monaPopupAnimation, reina: reinaPopupAnimation },
    monaPopupAnimation
);

export const popupThemeAnimation = (theme: ThemeStyle): PopupAnimationConfig =>
    defaultPopupAnimationStrategy.resolve(theme);

export function createPopupStyleStrategy(overrides: readonly PopupStyleOverrides[] = []): PopupAnimationStrategy {
    return createThemeStrategy<PopupAnimationConfig>(
        {
            mona: resolvePopupAnimation(monaPopupAnimation, overrides, "mona"),
            reina: resolvePopupAnimation(reinaPopupAnimation, overrides, "reina")
        },
        monaPopupAnimation
    );
}
