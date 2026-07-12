import { type ThemeStyle, createInheritedThemeStrategy } from "@nanahoshi/mona-ui/theme";
import {
    progressBarBaseVariants as monaProgressBarBaseVariants,
    progressBarIndeterminateVariants as monaProgressBarIndeterminateVariants,
    progressBarLabelVariants as monaProgressBarLabelVariants,
    progressBarTrackVariants as monaProgressBarTrackVariants
} from "./progress-bar.mona.styles";
import {
    reinaProgressBarBaseVariants,
    reinaProgressBarIndeterminateVariants,
    reinaProgressBarLabelVariants,
    reinaProgressBarTrackVariants
} from "./progress-bar.reina.styles";
import {
    createProgressBarBaseVariants,
    createProgressBarIndeterminateVariants,
    createProgressBarLabelVariants,
    createProgressBarTrackVariants
} from "./progress-bar.style-composition";
import type {
    ProgressBarBaseVariantsFunction,
    ProgressBarIndeterminateVariantsFunction,
    ProgressBarLabelVariantsFunction,
    ProgressBarStyleOverrides,
    ProgressBarStyleStrategy,
    ProgressBarTrackVariantsFunction,
    ProgressBarVariantsFunctions
} from "./progress-bar.types";

const defaultProgressBarBaseStrategy = createInheritedThemeStrategy<ProgressBarBaseVariantsFunction>(
    monaProgressBarBaseVariants,
    { reina: reinaProgressBarBaseVariants }
);
const defaultProgressBarIndeterminateStrategy = createInheritedThemeStrategy<ProgressBarIndeterminateVariantsFunction>(
    monaProgressBarIndeterminateVariants,
    { reina: reinaProgressBarIndeterminateVariants }
);
const defaultProgressBarLabelStrategy = createInheritedThemeStrategy<ProgressBarLabelVariantsFunction>(
    monaProgressBarLabelVariants,
    { reina: reinaProgressBarLabelVariants }
);
const defaultProgressBarTrackStrategy = createInheritedThemeStrategy<ProgressBarTrackVariantsFunction>(
    monaProgressBarTrackVariants,
    { reina: reinaProgressBarTrackVariants }
);

export const progressBarBaseThemeVariants = (theme: ThemeStyle): ProgressBarBaseVariantsFunction =>
    defaultProgressBarBaseStrategy.resolve(theme);
export const progressBarIndeterminateThemeVariants = (theme: ThemeStyle): ProgressBarIndeterminateVariantsFunction =>
    defaultProgressBarIndeterminateStrategy.resolve(theme);
export const progressBarLabelThemeVariants = (theme: ThemeStyle): ProgressBarLabelVariantsFunction =>
    defaultProgressBarLabelStrategy.resolve(theme);
export const progressBarTrackThemeVariants = (theme: ThemeStyle): ProgressBarTrackVariantsFunction =>
    defaultProgressBarTrackStrategy.resolve(theme);

export function createProgressBarStyleStrategy(
    overrides: readonly ProgressBarStyleOverrides[] = []
): ProgressBarStyleStrategy {
    const mona: ProgressBarVariantsFunctions = {
        base: createProgressBarBaseVariants(monaProgressBarBaseVariants, overrides, "mona"),
        indeterminate: createProgressBarIndeterminateVariants(monaProgressBarIndeterminateVariants, overrides, "mona"),
        label: createProgressBarLabelVariants(monaProgressBarLabelVariants, overrides, "mona"),
        track: createProgressBarTrackVariants(monaProgressBarTrackVariants, overrides, "mona")
    };
    const reina: ProgressBarVariantsFunctions = {
        base: createProgressBarBaseVariants(reinaProgressBarBaseVariants, overrides, "reina"),
        indeterminate: createProgressBarIndeterminateVariants(
            reinaProgressBarIndeterminateVariants,
            overrides,
            "reina"
        ),
        label: createProgressBarLabelVariants(reinaProgressBarLabelVariants, overrides, "reina"),
        track: createProgressBarTrackVariants(reinaProgressBarTrackVariants, overrides, "reina")
    };
    return createInheritedThemeStrategy<ProgressBarVariantsFunctions>(mona, { reina: reina });
}
