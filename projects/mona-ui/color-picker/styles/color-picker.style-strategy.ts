import { type ThemeStyle, createInheritedThemeStrategy } from "@nanahoshi/mona-ui/theme";
import {
    colorPickerBaseVariants as monaColorPickerBaseVariants,
    colorPickerColorVariants as monaColorPickerColorVariants
} from "./color-picker.mona.styles";
import { reinaColorPickerBaseVariants, reinaColorPickerColorVariants } from "./color-picker.reina.styles";
import { createColorPickerBaseVariants, createColorPickerColorVariants } from "./color-picker.style-composition";
import type {
    ColorPickerBaseVariantsFunction,
    ColorPickerColorVariantsFunction,
    ColorPickerStyleOverrides,
    ColorPickerStyleStrategy,
    ColorPickerVariantsFunctions
} from "./color-picker.types";

const defaultColorPickerBaseStrategy = createInheritedThemeStrategy<ColorPickerBaseVariantsFunction>(
    monaColorPickerBaseVariants,
    { reina: reinaColorPickerBaseVariants }
);
const defaultColorPickerColorStrategy = createInheritedThemeStrategy<ColorPickerColorVariantsFunction>(
    monaColorPickerColorVariants,
    { reina: reinaColorPickerColorVariants }
);

export const colorPickerBaseThemeVariants = (theme: ThemeStyle): ColorPickerBaseVariantsFunction =>
    defaultColorPickerBaseStrategy.resolve(theme);
export const colorPickerColorThemeVariants = (theme: ThemeStyle): ColorPickerColorVariantsFunction =>
    defaultColorPickerColorStrategy.resolve(theme);

export function createColorPickerStyleStrategy(
    overrides: readonly ColorPickerStyleOverrides[] = []
): ColorPickerStyleStrategy {
    const mona: ColorPickerVariantsFunctions = {
        base: createColorPickerBaseVariants(monaColorPickerBaseVariants, overrides, "mona"),
        color: createColorPickerColorVariants(monaColorPickerColorVariants, overrides, "mona")
    };
    const reina: ColorPickerVariantsFunctions = {
        base: createColorPickerBaseVariants(reinaColorPickerBaseVariants, overrides, "reina"),
        color: createColorPickerColorVariants(reinaColorPickerColorVariants, overrides, "reina")
    };
    return createInheritedThemeStrategy<ColorPickerVariantsFunctions>(mona, { reina: reina });
}
