import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "../../../theme/models/Theme";
import { chipVariants as monaChipVariants } from "./chip.mona.styles";
import { VariantInputs } from "../../../utils/VariantInputs";

export const chipThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaChipVariants;
        case "shadcn":
            return monaChipVariants; // Placeholder for Shadcn styles, if available
        default:
            return monaChipVariants;
    }
};

export type ChipVariantProps = VariantProps<ReturnType<typeof chipThemeVariants>>;
export type ChipVariantInputs = VariantInputs<ChipVariantProps>;
