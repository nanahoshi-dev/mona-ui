import { type ThemeStyle, createInheritedThemeStrategy } from "@nanahoshi/mona-ui/theme";
import {
    placeholderBaseVariants as monaPlaceholderBaseVariants,
    placeholderTextVariants as monaPlaceholderTextVariants
} from "./placeholder.mona.styles";
import { reinaPlaceholderBaseVariants, reinaPlaceholderTextVariants } from "./placeholder.reina.styles";
import { createPlaceholderBaseVariants, createPlaceholderTextVariants } from "./placeholder.style-composition";
import type {
    PlaceholderBaseVariantsFunction,
    PlaceholderStyleOverrides,
    PlaceholderStyleStrategy,
    PlaceholderTextVariantsFunction,
    PlaceholderVariantsFunctions
} from "./placeholder.types";

const defaultPlaceholderBaseStrategy = createInheritedThemeStrategy<PlaceholderBaseVariantsFunction>(
    monaPlaceholderBaseVariants,
    { reina: reinaPlaceholderBaseVariants }
);
const defaultPlaceholderTextStrategy = createInheritedThemeStrategy<PlaceholderTextVariantsFunction>(
    monaPlaceholderTextVariants,
    { reina: reinaPlaceholderTextVariants }
);

export const placeholderBaseThemeVariants = (theme: ThemeStyle): PlaceholderBaseVariantsFunction =>
    defaultPlaceholderBaseStrategy.resolve(theme);

export const placeholderTextThemeVariants = (theme: ThemeStyle): PlaceholderTextVariantsFunction =>
    defaultPlaceholderTextStrategy.resolve(theme);

export function createPlaceholderStyleStrategy(
    overrides: readonly PlaceholderStyleOverrides[] = []
): PlaceholderStyleStrategy {
    const mona: PlaceholderVariantsFunctions = {
        base: createPlaceholderBaseVariants(monaPlaceholderBaseVariants, overrides, "mona"),
        text: createPlaceholderTextVariants(monaPlaceholderTextVariants, overrides, "mona")
    };
    const reina: PlaceholderVariantsFunctions = {
        base: createPlaceholderBaseVariants(reinaPlaceholderBaseVariants, overrides, "reina"),
        text: createPlaceholderTextVariants(reinaPlaceholderTextVariants, overrides, "reina")
    };
    return createInheritedThemeStrategy<PlaceholderVariantsFunctions>(mona, { reina: reina });
}
