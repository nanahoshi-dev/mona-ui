import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "../../../theme/models/Theme";
import {
    switchVariants as monaSwitchVariants,
    switchHandleVariants as monaSwitchHandleVariants,
    switchLabelVariants as monaSwitchLabelVariants
} from "./switch.mona.styles";
import { VariantInputs } from "../../../utils/VariantInputs";

export const switchThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaSwitchVariants;
        default:
            return monaSwitchVariants; // Default to Mona styles
    }
};

export const switchHandleThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaSwitchHandleVariants;
        default:
            return monaSwitchHandleVariants; // Default to Mona styles
    }
};

export const switchLabelThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaSwitchLabelVariants;
        default:
            return monaSwitchLabelVariants; // Default to Mona styles
    }
};

export type SwitchBaseVariantProps = VariantProps<ReturnType<typeof switchThemeVariants>>;
export type SwitchBaseVariantInput = VariantInputs<SwitchBaseVariantProps>;

export type SwitchHandleVariantProps = VariantProps<ReturnType<typeof switchHandleThemeVariants>>;
export type SwitchHandleVariantInput = VariantInputs<SwitchHandleVariantProps>;

export type SwitchLabelVariantProps = VariantProps<ReturnType<typeof switchLabelThemeVariants>>;
export type SwitchLabelVariantInput = VariantInputs<SwitchLabelVariantProps>;

export type SwitchVariantProps = SwitchBaseVariantProps & SwitchHandleVariantProps & SwitchLabelVariantProps;
export type SwitchVariantInputs = SwitchBaseVariantInput & SwitchHandleVariantInput & SwitchLabelVariantInput;
