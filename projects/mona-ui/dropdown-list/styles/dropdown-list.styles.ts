import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    dropdownListAffixContainerVariants as monaDropdownListAffixContainerVariants,
    dropdownListInputVariants as monaDropdownListInputVariants,
    dropdownListValueContainerVariants as monaDropdownListValueContainerVariants
} from "./dropdown-list.mona.styles";

const dropdownListAffixContainerThemeVariantsStrategy = createThemeStrategy(
    { mona: monaDropdownListAffixContainerVariants },
    monaDropdownListAffixContainerVariants
);

export const dropdownListAffixContainerThemeVariants = (theme: ThemeStyle) =>
    dropdownListAffixContainerThemeVariantsStrategy.resolve(theme);

const dropdownListInputThemeVariantsStrategy = createThemeStrategy(
    { mona: monaDropdownListInputVariants },
    monaDropdownListInputVariants
);

export const dropdownListInputThemeVariants = (theme: ThemeStyle) =>
    dropdownListInputThemeVariantsStrategy.resolve(theme);

const dropdownListValueContainerThemeVariantsStrategy = createThemeStrategy(
    { mona: monaDropdownListValueContainerVariants },
    monaDropdownListValueContainerVariants
);

export const dropdownListValueContainerThemeVariants = (theme: ThemeStyle) =>
    dropdownListValueContainerThemeVariantsStrategy.resolve(theme);

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
