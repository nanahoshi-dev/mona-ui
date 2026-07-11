import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { splitButtonVariants as monaSplitButtonVariants } from "./split-button.mona.styles";
import { reinaSplitButtonVariants } from "./split-button.reina.styles";
import { createSplitButtonVariants } from "./split-button.style-composition";
import type {
    SplitButtonStyleOverrides,
    SplitButtonStyleStrategy,
    SplitButtonVariantsFunction
} from "./split-button.types";

const defaultSplitButtonStrategy = createThemeStrategy<SplitButtonVariantsFunction>(
    { mona: monaSplitButtonVariants, reina: reinaSplitButtonVariants },
    monaSplitButtonVariants
);

export const splitButtonThemeVariants = (theme: ThemeStyle): SplitButtonVariantsFunction =>
    defaultSplitButtonStrategy.resolve(theme);

export function createSplitButtonStyleStrategy(
    overrides: readonly SplitButtonStyleOverrides[] = []
): SplitButtonStyleStrategy {
    const mona = createSplitButtonVariants(monaSplitButtonVariants, overrides, "mona");
    const reina = createSplitButtonVariants(reinaSplitButtonVariants, overrides, "reina");
    return createThemeStrategy<SplitButtonVariantsFunction>({ mona, reina }, mona);
}
