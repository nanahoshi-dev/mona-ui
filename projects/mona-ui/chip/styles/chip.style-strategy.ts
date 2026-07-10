import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { chipVariants as monaChipVariants } from "./chip.mona.styles";
import { createChipVariants } from "./chip.style-composition";
import type { ChipStyleOverrides, ChipStyleStrategy, ChipVariantsFunction } from "./chip.types";

const defaultChipStrategy = createThemeStrategy<ChipVariantsFunction>({ mona: monaChipVariants }, monaChipVariants);

export const chipThemeVariants = (theme: ThemeStyle): ChipVariantsFunction => defaultChipStrategy.resolve(theme);

export function createChipStyleStrategy(overrides: readonly ChipStyleOverrides[] = []): ChipStyleStrategy {
    const mona = createChipVariants(monaChipVariants, overrides, "mona");
    const reina = createChipVariants(monaChipVariants, overrides, "reina");
    return createThemeStrategy<ChipVariantsFunction>({ mona, reina }, mona);
}
