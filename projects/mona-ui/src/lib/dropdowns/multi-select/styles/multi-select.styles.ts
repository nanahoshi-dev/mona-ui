import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "../../../theme/models/Theme";
import { VariantInputs } from "../../../utils/VariantInputs";
import {
    multiSelectBaseVariants as monaMultiSelectBaseVariants,
    multiSelectItemContainerVariants as monaMultiSelectItemContainerVariants,
    multiSelectAffixContainerVariants as monaMultiSelectAffixContainerVariants
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

export const multiSelectAffixContainerThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaMultiSelectAffixContainerVariants;
        default:
            return monaMultiSelectAffixContainerVariants;
    }
};

type MultiSelectBaseVariantProps = VariantProps<ReturnType<typeof multiSelectBaseThemeVariants>>;
type MultiSelectBaseVariantInput = VariantInputs<MultiSelectBaseVariantProps>;

type MultiSelectItemContainerVariantProps = VariantProps<ReturnType<typeof multiSelectItemContainerThemeVariants>>;
type MultiSelectItemContainerVariantInput = VariantInputs<MultiSelectItemContainerVariantProps>;

type MultiSelectAffixContainerVariantProps = VariantProps<ReturnType<typeof multiSelectAffixContainerThemeVariants>>;
type MultiSelectAffixContainerVariantInput = VariantInputs<MultiSelectAffixContainerVariantProps>;

export type MultiSelectVariantProps = MultiSelectBaseVariantProps &
    MultiSelectItemContainerVariantProps &
    MultiSelectAffixContainerVariantProps;
export type MultiSelectVariantInput = Omit<MultiSelectBaseVariantInput, "focused"> &
    MultiSelectItemContainerVariantInput &
    MultiSelectAffixContainerVariantInput;
