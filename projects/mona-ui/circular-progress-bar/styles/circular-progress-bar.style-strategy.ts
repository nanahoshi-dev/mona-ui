import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { circularProgressBarBaseVariants as monaCircularProgressBarBaseVariants } from "./circular-progress-bar.mona.styles";
import { reinaCircularProgressBarBaseVariants } from "./circular-progress-bar.reina.styles";
import { createCircularProgressBarBaseVariants } from "./circular-progress-bar.style-composition";
import type {
    CircularProgressBarBaseVariantsFunction,
    CircularProgressBarStyleOverrides,
    CircularProgressBarStyleStrategy,
    CircularProgressBarVariantsFunctions
} from "./circular-progress-bar.types";

const defaultCircularProgressBarBaseStrategy = createThemeStrategy<CircularProgressBarBaseVariantsFunction>(
    { mona: monaCircularProgressBarBaseVariants, reina: reinaCircularProgressBarBaseVariants },
    monaCircularProgressBarBaseVariants
);

export const circularProgressBarBaseThemeVariants = (theme: ThemeStyle): CircularProgressBarBaseVariantsFunction =>
    defaultCircularProgressBarBaseStrategy.resolve(theme);

export function createCircularProgressBarStyleStrategy(
    overrides: readonly CircularProgressBarStyleOverrides[] = []
): CircularProgressBarStyleStrategy {
    const mona: CircularProgressBarVariantsFunctions = {
        base: createCircularProgressBarBaseVariants(monaCircularProgressBarBaseVariants, overrides, "mona")
    };
    const reina: CircularProgressBarVariantsFunctions = {
        base: createCircularProgressBarBaseVariants(reinaCircularProgressBarBaseVariants, overrides, "reina")
    };
    return createThemeStrategy<CircularProgressBarVariantsFunctions>({ mona, reina }, mona);
}
