import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "../../../theme/models/Theme";
import { VariantInputs } from "../../../utils/VariantInputs";
import {
    multiSelectBaseVariants as monaMultiSelectBaseVariants,
    multiSelectItemContainerVariants as monaMultiSelectItemContainerVariants
} from "./multi-select.mona.styles";

export const multiSelectBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaMultiSelectBaseVariants;
        default:
            return monaMultiSelectBaseVariants;
    }
};

export const multiSelectItemContainerThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaMultiSelectItemContainerVariants;
        default:
            return monaMultiSelectItemContainerVariants;
    }
};

type MultiSelectBaseVariantProps = VariantProps<ReturnType<typeof multiSelectBaseThemeVariants>>;
type MultiSelectBaseVariantInput = VariantInputs<MultiSelectBaseVariantProps>;

type MultiSelectItemContainerVariantProps = VariantProps<ReturnType<typeof multiSelectItemContainerThemeVariants>>;
type MultiSelectItemContainerVariantInput = VariantInputs<MultiSelectItemContainerVariantProps>;

export type MultiSelectVariantProps = MultiSelectBaseVariantProps & MultiSelectItemContainerVariantProps;
export type MultiSelectVariantInput = Omit<MultiSelectBaseVariantInput, "focused"> &
    MultiSelectItemContainerVariantInput;
