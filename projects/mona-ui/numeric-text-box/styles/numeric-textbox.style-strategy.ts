import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { createMonaNumericTextboxVariants, createReinaNumericTextboxVariants } from "./numeric-textbox.style-composition";
import type {
    NumericTextboxStyleOverrides,
    NumericTextboxStyleStrategy,
    NumericTextboxVariantsBundle
} from "./numeric-textbox.types";

const defaultNumericTextboxStrategy = createThemeStrategy<NumericTextboxVariantsBundle>(
    {
        mona: createMonaNumericTextboxVariants([], "mona"),
        reina: createReinaNumericTextboxVariants([], "reina")
    },
    createMonaNumericTextboxVariants([], "mona")
);

export const numericTextboxThemeVariants = (theme: ThemeStyle): NumericTextboxVariantsBundle =>
    defaultNumericTextboxStrategy.resolve(theme);

export function createNumericTextboxStyleStrategy(
    overrides: readonly NumericTextboxStyleOverrides[] = []
): NumericTextboxStyleStrategy {
    const mona = createMonaNumericTextboxVariants(overrides, "mona");
    const reina = createReinaNumericTextboxVariants(overrides, "reina");
    return createThemeStrategy<NumericTextboxVariantsBundle>({ mona, reina }, mona);
}
