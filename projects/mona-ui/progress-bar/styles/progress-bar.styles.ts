import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "@mirei/mona-ui/theme";
import { VariantInputs } from "@mirei/mona-ui/internal";
import {
    progressBarBaseVariants as monaProgressBarBaseVariants,
    progressBarIndeterminateVariants as monaProgressBarIndeterminateVariants,
    progressBarLabelVariants as monaProgressBarLabelVariants,
    progressBarTrackVariants as monaProgressBarTrackVariants
} from "./progress-bar.mona.styles";

export const progressBarBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaProgressBarBaseVariants;
        default:
            return monaProgressBarBaseVariants;
    }
};

export const progressBarIndeterminateThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaProgressBarIndeterminateVariants;
        default:
            return monaProgressBarIndeterminateVariants;
    }
};

export const progressBarLabelThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaProgressBarLabelVariants;
        default:
            return monaProgressBarLabelVariants;
    }
};

export const progressBarTrackThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaProgressBarTrackVariants;
        default:
            return monaProgressBarTrackVariants;
    }
};

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
