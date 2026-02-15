import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "../../theme/models/Theme";
import { VariantInputs } from "../../utils/VariantInputs";
import {
    windowBaseVariants as monaWindowBaseVariants,
    windowContentContainerVariants as monaWindowContentContainerVariants,
    windowContentVariants as monaWindowContentVariants,
    windowResizerVariants as monaWindowResizerVariants,
    windowTitleBarActionVariants as monaWindowTitleBarActionVariants,
    windowTitleBarVariants as monaWindowTitleBarVariants,
    windowTitleContainerVariants as monaWindowTitleContainerVariants,
    windowTitleVariants as monaWindowTitleVariants
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

export const windowContentThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaWindowContentVariants;
        default:
            return monaWindowContentVariants;
    }
};

export const windowResizerThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaWindowResizerVariants;
        default:
            return monaWindowResizerVariants;
    }
};

export const windowTitleBarActionThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaWindowTitleBarActionVariants;
        default:
            return monaWindowTitleBarActionVariants;
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

export const windowTitleThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaWindowTitleVariants;
        default:
            return monaWindowTitleVariants;
    }
};

type WindowBaseVariantProps = VariantProps<ReturnType<typeof windowBaseThemeVariants>>;
type WindowBaseVariantInput = VariantInputs<WindowBaseVariantProps>;

type WindowContentContainerVariantProps = VariantProps<ReturnType<typeof windowContentContainerThemeVariants>>;
type WindowContentContainerVariantInput = VariantInputs<WindowContentContainerVariantProps>;

type WindowContentVariantProps = VariantProps<ReturnType<typeof windowContentThemeVariants>>;

export type WindowResizerVariantProps = VariantProps<ReturnType<typeof windowResizerThemeVariants>>;
type WindowResizerVariantInput = VariantInputs<WindowResizerVariantProps>;

type WindowTitleBarActionVariantProps = VariantProps<ReturnType<typeof windowTitleBarActionThemeVariants>>;
type WindowTitleBarActionVariantInput = VariantInputs<WindowTitleBarActionVariantProps>;

type WindowTitleBarVariantProps = VariantProps<ReturnType<typeof windowTitleBarThemeVariants>>;
type WindowTitleBarVariantInput = VariantInputs<WindowTitleBarVariantProps>;

type WindowTitleContainerVariantProps = VariantProps<ReturnType<typeof windowTitleContainerThemeVariants>>;
type WindowTitleContainerVariantInput = VariantInputs<WindowTitleContainerVariantProps>;

type WindowTitleVariantProps = VariantProps<ReturnType<typeof windowTitleThemeVariants>>;
type WindowTitleVariantInput = VariantInputs<WindowTitleVariantProps>;

export type WindowVariantProps = WindowBaseVariantProps &
    WindowContentContainerVariantProps &
    WindowContentVariantProps &
    WindowResizerVariantProps &
    WindowTitleBarActionVariantProps &
    WindowTitleBarVariantProps &
    WindowTitleContainerVariantProps &
    WindowTitleVariantProps;
export type WindowVariantInput = WindowBaseVariantInput &
    WindowContentContainerVariantInput &
    WindowResizerVariantInput &
    WindowTitleBarVariantInput &
    WindowTitleContainerVariantInput &
    WindowTitleBarActionVariantInput &
    WindowTitleVariantInput;

export type WindowContentVariantInput = Omit<WindowVariantInput, "position" | "rounded">;
