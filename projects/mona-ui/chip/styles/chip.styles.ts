import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import { chipVariants as annaChipVariants } from "./chip.anna.styles";
import { chipVariants as monaChipVariants } from "./chip.mona.styles";

export const chipThemeVariants = createThemeStrategy({
    anna: annaChipVariants,
    mona: monaChipVariants
});

export type ChipVariantProps = VariantProps<ReturnType<typeof chipThemeVariants>>;
export type ChipVariantInputs = VariantInputs<ChipVariantProps>;
