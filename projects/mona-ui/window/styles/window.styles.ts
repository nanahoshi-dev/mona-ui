import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    windowBaseVariants as annaWindowBaseVariants,
    windowContentContainerVariants as annaWindowContentContainerVariants,
    windowContentVariants as annaWindowContentVariants,
    windowResizerVariants as annaWindowResizerVariants,
    windowTitleBarActionVariants as annaWindowTitleBarActionVariants,
    windowTitleBarVariants as annaWindowTitleBarVariants,
    windowTitleContainerVariants as annaWindowTitleContainerVariants,
    windowTitleVariants as annaWindowTitleVariants
} from "./window.anna.styles";
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

export const windowBaseThemeVariants = createThemeStrategy({
    anna: annaWindowBaseVariants,
    mona: monaWindowBaseVariants
});

export const windowContentContainerThemeVariants = createThemeStrategy({
    anna: annaWindowContentContainerVariants,
    mona: monaWindowContentContainerVariants
});

export const windowContentThemeVariants = createThemeStrategy({
    anna: annaWindowContentVariants,
    mona: monaWindowContentVariants
});

export const windowResizerThemeVariants = createThemeStrategy({
    anna: annaWindowResizerVariants,
    mona: monaWindowResizerVariants
});

export const windowTitleBarActionThemeVariants = createThemeStrategy({
    anna: annaWindowTitleBarActionVariants,
    mona: monaWindowTitleBarActionVariants
});

export const windowTitleBarThemeVariants = createThemeStrategy({
    anna: annaWindowTitleBarVariants,
    mona: monaWindowTitleBarVariants
});

export const windowTitleContainerThemeVariants = createThemeStrategy({
    anna: annaWindowTitleContainerVariants,
    mona: monaWindowTitleContainerVariants
});

export const windowTitleThemeVariants = createThemeStrategy({
    anna: annaWindowTitleVariants,
    mona: monaWindowTitleVariants
});

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
    Omit<WindowResizerVariantInput, "position"> &
    WindowTitleBarVariantInput &
    WindowTitleContainerVariantInput &
    WindowTitleBarActionVariantInput &
    WindowTitleVariantInput;

export type WindowContentVariantInput = Omit<WindowVariantInput, "look" | "position" | "rounded">;
