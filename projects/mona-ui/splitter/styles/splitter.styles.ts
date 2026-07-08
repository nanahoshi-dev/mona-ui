import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "@mirei/mona-ui/theme";
import { VariantInputs } from "@mirei/mona-ui/common";
import {
    splitterBaseVariants as monaSplitterBaseVariants,
    splitterResizerHandleVariants as monaSplitterResizerHandleVariants,
    splitterResizerVariants as monaSplitterResizerVariants
} from "./splitter.mona.styles";

export const splitterBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaSplitterBaseVariants;
        default:
            return monaSplitterBaseVariants;
    }
};

export const splitterResizerThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaSplitterResizerVariants;
        default:
            return monaSplitterResizerVariants;
    }
};

export const splitterResizerHandleThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaSplitterResizerHandleVariants;
        default:
            return monaSplitterResizerHandleVariants;
    }
};

type SplitterBaseVariantProps = VariantProps<ReturnType<typeof splitterBaseThemeVariants>>;
type SplitterBaseVariantInput = VariantInputs<SplitterBaseVariantProps>;
type SplitterResizerVariantProps = VariantProps<ReturnType<typeof splitterResizerThemeVariants>>;
type SplitterResizerVariantInput = VariantInputs<SplitterResizerVariantProps>;
type SplitterResizerHandleVariantProps = VariantProps<ReturnType<typeof splitterResizerHandleThemeVariants>>;
type SplitterResizerHandleVariantInput = VariantInputs<SplitterResizerHandleVariantProps>;

export type SplitterVariantProps = SplitterBaseVariantProps &
    SplitterResizerVariantProps &
    SplitterResizerHandleVariantProps;
export type SplitterVariantInput = SplitterBaseVariantInput &
    Omit<SplitterResizerVariantInput, "resizing"> &
    SplitterResizerHandleVariantInput;
