import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { PopupAnimationConfig, PopupStyleOverrides } from "./popup.types";

export function resolvePopupAnimation(
    base: PopupAnimationConfig,
    overrides: readonly PopupStyleOverrides[],
    theme: ThemeStyle
): PopupAnimationConfig {
    const activeOverrides = overrides.filter(override => override.theme === undefined || override.theme === theme);

    return activeOverrides.reduce<PopupAnimationConfig>(
        (config, override) => ({
            enter: override.enter ?? config.enter,
            leave: override.leave ?? config.leave
        }),
        base
    );
}
