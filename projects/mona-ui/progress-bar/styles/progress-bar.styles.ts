import { VariantProps } from "class-variance-authority";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import {
    progressBarBaseVariants as annaProgressBarBaseVariants,
    progressBarIndeterminateVariants as annaProgressBarIndeterminateVariants,
    progressBarLabelVariants as annaProgressBarLabelVariants,
    progressBarTrackVariants as annaProgressBarTrackVariants
} from "./progress-bar.anna.styles";
import {
    progressBarBaseVariants as monaProgressBarBaseVariants,
    progressBarIndeterminateVariants as monaProgressBarIndeterminateVariants,
    progressBarLabelVariants as monaProgressBarLabelVariants,
    progressBarTrackVariants as monaProgressBarTrackVariants
} from "./progress-bar.mona.styles";

export const progressBarBaseThemeVariants = createThemeStrategy({
    anna: annaProgressBarBaseVariants,
    mona: monaProgressBarBaseVariants
});

export const progressBarIndeterminateThemeVariants = createThemeStrategy({
    anna: annaProgressBarIndeterminateVariants,
    mona: monaProgressBarIndeterminateVariants
});

export const progressBarLabelThemeVariants = createThemeStrategy({
    anna: annaProgressBarLabelVariants,
    mona: monaProgressBarLabelVariants
});

export const progressBarTrackThemeVariants = createThemeStrategy({
    anna: annaProgressBarTrackVariants,
    mona: monaProgressBarTrackVariants
});

type ProgressBarBaseVariantProps = VariantProps<ReturnType<typeof progressBarBaseThemeVariants>>;
type ProgressBarBaseVariantInput = VariantInputs<ProgressBarBaseVariantProps>;
type ProgressBarIndeterminateVariantProps = VariantProps<ReturnType<typeof progressBarIndeterminateThemeVariants>>;
type ProgressBarIndeterminateVariantInput = VariantInputs<ProgressBarIndeterminateVariantProps>;
type ProgressBarLabelVariantProps = VariantProps<ReturnType<typeof progressBarLabelThemeVariants>>;
type ProgressBarLabelVariantInput = VariantInputs<ProgressBarLabelVariantProps>;
type ProgressBarTrackVariantProps = VariantProps<ReturnType<typeof progressBarTrackThemeVariants>>;
type ProgressBarTrackVariantInput = VariantInputs<ProgressBarTrackVariantProps>;

export type ProgressBarVariantProps = ProgressBarBaseVariantProps &
    ProgressBarIndeterminateVariantProps &
    ProgressBarTrackVariantProps &
    ProgressBarLabelVariantProps;
export type ProgressBarVariantInput = ProgressBarBaseVariantInput &
    ProgressBarIndeterminateVariantInput &
    ProgressBarTrackVariantInput &
    ProgressBarLabelVariantInput;
