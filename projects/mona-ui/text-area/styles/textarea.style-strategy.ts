import { type ThemeStyle, createInheritedThemeStrategy } from "@nanahoshi/mona-ui/theme";
import { textAreaVariants as monaTextAreaVariants } from "./textarea.mona.styles";
import { reinaTextAreaVariants } from "./textarea.reina.styles";
import { createTextAreaVariants } from "./textarea.style-composition";
import type {
    TextAreaStyleOverrides,
    TextAreaStyleStrategy,
    TextAreaVariantsFunction,
    TextAreaVariantsFunctions
} from "./textarea.types";

const defaultTextAreaStrategy = createInheritedThemeStrategy<TextAreaVariantsFunction>(monaTextAreaVariants, {
    reina: reinaTextAreaVariants
});

export const textAreaThemeVariants = (theme: ThemeStyle): TextAreaVariantsFunction =>
    defaultTextAreaStrategy.resolve(theme);

export function createTextAreaStyleStrategy(overrides: readonly TextAreaStyleOverrides[] = []): TextAreaStyleStrategy {
    const mona: TextAreaVariantsFunctions = {
        base: createTextAreaVariants(monaTextAreaVariants, overrides, "mona")
    };
    const reina: TextAreaVariantsFunctions = {
        base: createTextAreaVariants(reinaTextAreaVariants, overrides, "reina")
    };
    return createInheritedThemeStrategy<TextAreaVariantsFunctions>(mona, { reina: reina });
}
