import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "../../../theme/models/Theme";
import { VariantInputs } from "../../../utils/VariantInputs";
import {
    dropdownListAffixContainerVariants as monaDropdownListAffixContainerVariants,
    dropdownListInputVariants as monaDropdownListInputVariants,
    dropdownListValueContainerVariants as monaDropdownListValueContainerVariants
} from "./dropdown-list.mona.styles";

export const dropdownListAffixContainerThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaDropdownListAffixContainerVariants;
        default:
            return monaDropdownListAffixContainerVariants;
    }
};

export const dropdownListInputThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaDropdownListInputVariants;
        default:
            return monaDropdownListInputVariants;
    }
};

export const dropdownListValueContainerThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaDropdownListValueContainerVariants;
        default:
            return monaDropdownListValueContainerVariants;
    }
};

type DropdownListInputVariantProps = VariantProps<ReturnType<typeof dropdownListInputThemeVariants>>;
type DropdownListInputVariantInput = VariantInputs<DropdownListInputVariantProps>;

type DropdownListAffixContainerVariantProps = VariantProps<ReturnType<typeof dropdownListAffixContainerThemeVariants>>;
type DropdownListAffixContainerVariantInput = VariantInputs<DropdownListAffixContainerVariantProps>;

type DropdownListValueContainerVariantProps = VariantProps<ReturnType<typeof dropdownListValueContainerThemeVariants>>;
type DropdownListValueContainerVariantInput = VariantInputs<DropdownListValueContainerVariantProps>;

export type DropDownListVariantProps = DropdownListInputVariantProps &
    DropdownListAffixContainerVariantProps &
    DropdownListValueContainerVariantProps;
export type DropDownListVariantInput = Omit<DropdownListInputVariantInput, "expanded" | "hasPrefix"> &
    DropdownListAffixContainerVariantInput &
    Omit<DropdownListValueContainerVariantInput, "hasTemplate">;
