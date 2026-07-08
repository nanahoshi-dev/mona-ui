import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "@mirei/mona-ui/theme";
import {
    switchVariants as monaSwitchVariants,
    switchHandleVariants as monaSwitchHandleVariants,
    switchLabelVariants as monaSwitchLabelVariants
} from "./switch.mona.styles";
import { VariantInputs } from "@mirei/mona-ui/common";

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

type SwitchBaseVariantProps = VariantProps<ReturnType<typeof switchThemeVariants>>;
type SwitchBaseVariantInput = VariantInputs<SwitchBaseVariantProps>;

type SwitchHandleVariantProps = VariantProps<ReturnType<typeof switchHandleThemeVariants>>;
type SwitchHandleVariantInput = VariantInputs<SwitchHandleVariantProps>;

type SwitchLabelVariantProps = VariantProps<ReturnType<typeof switchLabelThemeVariants>>;
type SwitchLabelVariantInput = VariantInputs<SwitchLabelVariantProps>;

export type SwitchVariantProps = SwitchBaseVariantProps & SwitchHandleVariantProps & SwitchLabelVariantProps;
export type SwitchVariantInputs = SwitchBaseVariantInput & SwitchHandleVariantInput & SwitchLabelVariantInput;
