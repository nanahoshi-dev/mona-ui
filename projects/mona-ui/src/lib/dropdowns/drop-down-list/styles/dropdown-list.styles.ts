import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "../../../theme/models/Theme";
import { VariantInputs } from "../../../utils/VariantInputs";
import {
    dropdownListInputVariants as monaDropdownListInputVariants,
    dropdownListPopupVariants as monaDropdownListPopupVariants
} from "./dropdown-list.mona.styles";

export const dropdownListInputThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaDropdownListInputVariants;
        default:
            return monaDropdownListInputVariants;
    }
};

export const dropdownListPopupThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaDropdownListPopupVariants;
        default:
            return monaDropdownListPopupVariants;
    }
};

type DropdownListInputVariantProps = VariantProps<ReturnType<typeof dropdownListInputThemeVariants>>;
type DropdownListInputVariantInput = VariantInputs<DropdownListInputVariantProps>;

type DropdownListPopupVariantProps = VariantProps<ReturnType<typeof dropdownListPopupThemeVariants>>;
type DropdownListPopupVariantInput = VariantInputs<DropdownListPopupVariantProps>;

export type DropDownListVariantProps = DropdownListInputVariantProps & DropdownListPopupVariantProps;
export type DropDownListVariantInput = DropdownListInputVariantInput & DropdownListPopupVariantInput;
