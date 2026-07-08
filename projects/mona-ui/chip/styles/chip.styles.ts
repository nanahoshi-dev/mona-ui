import { VariantInputs } from "@mirei/mona-ui/common";
import { ThemeStyle } from "@mirei/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import { chipVariants as monaChipVariants } from "./chip.mona.styles";

export const chipThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaChipVariants;
        default:
            return monaChipVariants;
    }
};

export type ChipVariantProps = VariantProps<ReturnType<typeof chipThemeVariants>>;
export type ChipVariantInputs = VariantInputs<ChipVariantProps>;
