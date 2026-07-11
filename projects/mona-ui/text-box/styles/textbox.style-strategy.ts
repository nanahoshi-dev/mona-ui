import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { createMonaTextBoxVariants, createReinaTextBoxVariants } from "./textbox.style-composition";
import type { TextBoxStyleOverrides, TextBoxStyleStrategy, TextBoxVariantsBundle } from "./textbox.types";

const defaultTextBoxStrategy = createThemeStrategy<TextBoxVariantsBundle>(
    {
        mona: createMonaTextBoxVariants([], "mona"),
        reina: createReinaTextBoxVariants([], "reina")
    },
    createMonaTextBoxVariants([], "mona")
);

export const textBoxThemeVariants = (theme: ThemeStyle): TextBoxVariantsBundle => defaultTextBoxStrategy.resolve(theme);

export function createTextBoxStyleStrategy(overrides: readonly TextBoxStyleOverrides[] = []): TextBoxStyleStrategy {
    const mona = createMonaTextBoxVariants(overrides, "mona");
    const reina = createReinaTextBoxVariants(overrides, "reina");
    return createThemeStrategy<TextBoxVariantsBundle>({ mona, reina }, mona);
}
