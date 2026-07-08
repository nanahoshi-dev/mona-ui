import type { VariantProps } from "class-variance-authority";
import { circularProgressBarBaseVariants as monaCircularProgressBarBaseVariants } from "../../circular-progress-bar/styles/circular-progress-bar.mona.styles";
import type { ThemeStyle } from "@mirei/mona-ui/theme";
import type { VariantInputs } from "@mirei/mona-ui/common";

export const circularProgressBarBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaCircularProgressBarBaseVariants;
        default:
            return monaCircularProgressBarBaseVariants;
    }
};

type CircularProgressBarBaseVariantProps = VariantProps<ReturnType<typeof circularProgressBarBaseThemeVariants>>;
export type CircularProgressBarBaseVariantInput = VariantInputs<CircularProgressBarBaseVariantProps>;

export type CircularProgressBarVariantProps = CircularProgressBarBaseVariantProps;
export type CircularProgressBarVariantInput = CircularProgressBarBaseVariantInput;
