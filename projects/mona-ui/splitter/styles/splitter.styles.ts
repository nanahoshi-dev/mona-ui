import { VariantProps } from "class-variance-authority";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import {
    splitterBaseVariants as annaSplitterBaseVariants,
    splitterResizerHandleVariants as annaSplitterResizerHandleVariants,
    splitterResizerVariants as annaSplitterResizerVariants
} from "./splitter.anna.styles";
import {
    splitterBaseVariants as monaSplitterBaseVariants,
    splitterResizerHandleVariants as monaSplitterResizerHandleVariants,
    splitterResizerVariants as monaSplitterResizerVariants
} from "./splitter.mona.styles";

export const splitterBaseThemeVariants = createThemeStrategy({
    anna: annaSplitterBaseVariants,
    mona: monaSplitterBaseVariants
});

export const splitterResizerThemeVariants = createThemeStrategy({
    anna: annaSplitterResizerVariants,
    mona: monaSplitterResizerVariants
});

export const splitterResizerHandleThemeVariants = createThemeStrategy({
    anna: annaSplitterResizerHandleVariants,
    mona: monaSplitterResizerHandleVariants
});

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
