import { type ThemeStyle, createInheritedThemeStrategy } from "@nanahoshi/mona-ui/theme";
import {
    createMonaNumericTextboxVariants,
    createReinaNumericTextboxVariants
} from "./numeric-textbox.style-composition";
import type {
    NumericTextboxStyleOverrides,
    NumericTextboxStyleStrategy,
    NumericTextboxVariantsBundle
} from "./numeric-textbox.types";

const defaultNumericTextboxStrategy = createInheritedThemeStrategy<NumericTextboxVariantsBundle>(
    createMonaNumericTextboxVariants([], "mona"),
    { reina: createReinaNumericTextboxVariants([], "reina") }
);

export const numericTextboxThemeVariants = (theme: ThemeStyle): NumericTextboxVariantsBundle =>
    defaultNumericTextboxStrategy.resolve(theme);

export function createNumericTextboxStyleStrategy(
    overrides: readonly NumericTextboxStyleOverrides[] = []
): NumericTextboxStyleStrategy {
    const mona = createMonaNumericTextboxVariants(overrides, "mona");
    const reina = createReinaNumericTextboxVariants(overrides, "reina");
    return createInheritedThemeStrategy<NumericTextboxVariantsBundle>(mona, { reina: reina });
}
