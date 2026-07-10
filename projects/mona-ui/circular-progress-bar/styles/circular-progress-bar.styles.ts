import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantProps } from "class-variance-authority";
import { circularProgressBarBaseVariants as monaCircularProgressBarBaseVariants } from "./circular-progress-bar.mona.styles";

const circularProgressBarBaseThemeVariantsStrategy = createThemeStrategy(
    { mona: monaCircularProgressBarBaseVariants },
    monaCircularProgressBarBaseVariants
);

export const circularProgressBarBaseThemeVariants = (theme: ThemeStyle) =>
    circularProgressBarBaseThemeVariantsStrategy.resolve(theme);

type CircularProgressBarBaseVariantProps = VariantProps<ReturnType<typeof circularProgressBarBaseThemeVariants>>;
export type CircularProgressBarBaseVariantInput = VariantInputs<CircularProgressBarBaseVariantProps>;

export type CircularProgressBarVariantProps = CircularProgressBarBaseVariantProps;
export type CircularProgressBarVariantInput = CircularProgressBarBaseVariantInput;
