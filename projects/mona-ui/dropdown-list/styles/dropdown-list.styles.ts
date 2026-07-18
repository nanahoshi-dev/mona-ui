import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    dropdownListAffixContainerVariants as annaDropdownListAffixContainerVariants,
    dropdownListInputVariants as annaDropdownListInputVariants,
    dropdownListValueContainerVariants as annaDropdownListValueContainerVariants
} from "./dropdown-list.anna.styles";
import {
    dropdownListAffixContainerVariants as monaDropdownListAffixContainerVariants,
    dropdownListInputVariants as monaDropdownListInputVariants,
    dropdownListValueContainerVariants as monaDropdownListValueContainerVariants
} from "./dropdown-list.mona.styles";

export const dropdownListAffixContainerThemeVariants = createThemeStrategy({
    anna: annaDropdownListAffixContainerVariants,
    mona: monaDropdownListAffixContainerVariants
});

export const dropdownListInputThemeVariants = createThemeStrategy({
    anna: annaDropdownListInputVariants,
    mona: monaDropdownListInputVariants
});

export const dropdownListValueContainerThemeVariants = createThemeStrategy({
    anna: annaDropdownListValueContainerVariants,
    mona: monaDropdownListValueContainerVariants
});

type DropdownListInputVariantProps = VariantProps<ReturnType<typeof dropdownListInputThemeVariants>>;
type DropdownListInputVariantInput = VariantInputs<DropdownListInputVariantProps>;

type DropdownListAffixContainerVariantProps = VariantProps<ReturnType<typeof dropdownListAffixContainerThemeVariants>>;
type DropdownListAffixContainerVariantInput = VariantInputs<DropdownListAffixContainerVariantProps>;

type DropdownListValueContainerVariantProps = VariantProps<ReturnType<typeof dropdownListValueContainerThemeVariants>>;
type DropdownListValueContainerVariantInput = VariantInputs<DropdownListValueContainerVariantProps>;

export type DropDownListVariantProps = DropdownListInputVariantProps &
    DropdownListAffixContainerVariantProps &
    DropdownListValueContainerVariantProps;
export type DropDownListVariantInput = Omit<DropdownListInputVariantInput, "expanded" | "hasPrefix" | "invalid"> &
    DropdownListAffixContainerVariantInput &
    Omit<DropdownListValueContainerVariantInput, "hasTemplate">;
