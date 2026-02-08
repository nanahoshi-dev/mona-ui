import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "../../theme/models/Theme";
import { VariantInputs } from "../../utils/VariantInputs";
import {
    windowBaseVariants as monaWindowBaseVariants,
    windowContentContainerVariants as monaWindowContentContainerVariants,
    windowTitleBarVariants as monaWindowTitleBarVariants,
    windowTitleContainerVariants as monaWindowTitleContainerVariants
} from "./window.mona.styles";

export const windowBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaWindowBaseVariants;
        default:
            return monaWindowBaseVariants;
    }
};

export const windowContentContainerThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaWindowContentContainerVariants;
        default:
            return monaWindowContentContainerVariants;
    }
};

export const windowTitleBarThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaWindowTitleBarVariants;
        default:
            return monaWindowTitleBarVariants;
    }
};

export const windowTitleContainerThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaWindowTitleContainerVariants;
        default:
            return monaWindowTitleContainerVariants;
    }
};

type WindowBaseVariantProps = VariantProps<ReturnType<typeof windowBaseThemeVariants>>;
type WindowBaseVariantInput = VariantInputs<WindowBaseVariantProps>;

type WindowContentContainerVariantProps = VariantProps<ReturnType<typeof windowContentContainerThemeVariants>>;
type WindowContentContainerVariantInput = VariantInputs<WindowContentContainerVariantProps>;

type WindowTitleBarVariantProps = VariantProps<ReturnType<typeof windowTitleBarThemeVariants>>;
type WindowTitleBarVariantInput = VariantInputs<WindowTitleBarVariantProps>;

type WindowTitleContainerVariantProps = VariantProps<ReturnType<typeof windowTitleContainerThemeVariants>>;
type WindowTitleContainerVariantInput = VariantInputs<WindowTitleContainerVariantProps>;

export type WindowVariantProps = WindowBaseVariantProps &
    WindowContentContainerVariantProps &
    WindowTitleBarVariantProps &
    WindowTitleContainerVariantProps;
export type WindowVariantInput = WindowBaseVariantInput &
    WindowContentContainerVariantInput &
    WindowTitleBarVariantInput &
    WindowTitleContainerVariantInput;

export type WindowContentVariantInput = Omit<WindowVariantInput, "rounded">;
