import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "../../../theme/models/Theme";
import { VariantInputs } from "../../../utils/VariantInputs";
import {
    multiSelectAffixContainerVariants as monaMultiSelectAffixContainerVariants,
    multiSelectBaseVariants as monaMultiSelectBaseVariants,
    multiSelectIndicatorContainerVariants as monaMultiSelectIndicatorContainerVariants,
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

export const multiSelectAffixContainerThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaMultiSelectAffixContainerVariants;
        default:
            return monaMultiSelectAffixContainerVariants;
    }
};

export const multiSelectIndicatorContainerThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaMultiSelectIndicatorContainerVariants;
        default:
            return monaMultiSelectIndicatorContainerVariants;
    }
};

type MultiSelectBaseVariantProps = VariantProps<ReturnType<typeof multiSelectBaseThemeVariants>>;
type MultiSelectBaseVariantInput = VariantInputs<MultiSelectBaseVariantProps>;

type MultiSelectItemContainerVariantProps = VariantProps<ReturnType<typeof multiSelectItemContainerThemeVariants>>;
type MultiSelectItemContainerVariantInput = VariantInputs<MultiSelectItemContainerVariantProps>;

type MultiSelectAffixContainerVariantProps = VariantProps<ReturnType<typeof multiSelectAffixContainerThemeVariants>>;
type MultiSelectAffixContainerVariantInput = VariantInputs<MultiSelectAffixContainerVariantProps>;

type MultiSelectIndicatorContainerVariantProps = VariantProps<
    ReturnType<typeof multiSelectIndicatorContainerThemeVariants>
>;
type MultiSelectIndicatorContainerVariantInput = VariantInputs<MultiSelectIndicatorContainerVariantProps>;

export type MultiSelectVariantProps = MultiSelectBaseVariantProps &
    MultiSelectItemContainerVariantProps &
    MultiSelectAffixContainerVariantProps &
    MultiSelectIndicatorContainerVariantProps;
export type MultiSelectVariantInput = Omit<MultiSelectBaseVariantInput, "focused" | "invalid"> &
    MultiSelectItemContainerVariantInput &
    MultiSelectAffixContainerVariantInput &
    MultiSelectIndicatorContainerVariantInput;
