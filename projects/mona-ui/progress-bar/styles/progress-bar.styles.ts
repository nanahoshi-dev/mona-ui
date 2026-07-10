import { VariantProps } from "class-variance-authority";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import {
    progressBarBaseVariants as monaProgressBarBaseVariants,
    progressBarIndeterminateVariants as monaProgressBarIndeterminateVariants,
    progressBarLabelVariants as monaProgressBarLabelVariants,
    progressBarTrackVariants as monaProgressBarTrackVariants
} from "./progress-bar.mona.styles";

const progressBarBaseThemeVariantsStrategy = createThemeStrategy(
    { mona: monaProgressBarBaseVariants },
    monaProgressBarBaseVariants
);

export const progressBarBaseThemeVariants = (theme: ThemeStyle) => progressBarBaseThemeVariantsStrategy.resolve(theme);

const progressBarIndeterminateThemeVariantsStrategy = createThemeStrategy(
    { mona: monaProgressBarIndeterminateVariants },
    monaProgressBarIndeterminateVariants
);

export const progressBarIndeterminateThemeVariants = (theme: ThemeStyle) =>
    progressBarIndeterminateThemeVariantsStrategy.resolve(theme);

const progressBarLabelThemeVariantsStrategy = createThemeStrategy(
    { mona: monaProgressBarLabelVariants },
    monaProgressBarLabelVariants
);

export const progressBarLabelThemeVariants = (theme: ThemeStyle) =>
    progressBarLabelThemeVariantsStrategy.resolve(theme);

const progressBarTrackThemeVariantsStrategy = createThemeStrategy(
    { mona: monaProgressBarTrackVariants },
    monaProgressBarTrackVariants
);

export const progressBarTrackThemeVariants = (theme: ThemeStyle) =>
    progressBarTrackThemeVariantsStrategy.resolve(theme);

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
