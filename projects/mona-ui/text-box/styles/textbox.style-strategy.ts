import { type ThemeStyle, createInheritedThemeStrategy } from "@nanahoshi/mona-ui/theme";
import { createMonaTextBoxVariants, createReinaTextBoxVariants } from "./textbox.style-composition";
import type { TextBoxStyleOverrides, TextBoxStyleStrategy, TextBoxVariantsBundle } from "./textbox.types";

const defaultTextBoxStrategy = createInheritedThemeStrategy<TextBoxVariantsBundle>(
    createMonaTextBoxVariants([], "mona"),
    { reina: createReinaTextBoxVariants([], "reina") }
);

export const textBoxThemeVariants = (theme: ThemeStyle): TextBoxVariantsBundle => defaultTextBoxStrategy.resolve(theme);

export function createTextBoxStyleStrategy(overrides: readonly TextBoxStyleOverrides[] = []): TextBoxStyleStrategy {
    const mona = createMonaTextBoxVariants(overrides, "mona");
    const reina = createReinaTextBoxVariants(overrides, "reina");
    return createInheritedThemeStrategy<TextBoxVariantsBundle>(mona, { reina: reina });
}
