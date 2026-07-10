import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
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

const windowBaseThemeVariantsStrategy = createThemeStrategy({ mona: monaWindowBaseVariants }, monaWindowBaseVariants);

export const windowBaseThemeVariants = (theme: ThemeStyle) => windowBaseThemeVariantsStrategy.resolve(theme);

const windowContentContainerThemeVariantsStrategy = createThemeStrategy(
    { mona: monaWindowContentContainerVariants },
    monaWindowContentContainerVariants
);

export const windowContentContainerThemeVariants = (theme: ThemeStyle) =>
    windowContentContainerThemeVariantsStrategy.resolve(theme);

const windowContentThemeVariantsStrategy = createThemeStrategy(
    { mona: monaWindowContentVariants },
    monaWindowContentVariants
);

export const windowContentThemeVariants = (theme: ThemeStyle) => windowContentThemeVariantsStrategy.resolve(theme);

const windowResizerThemeVariantsStrategy = createThemeStrategy(
    { mona: monaWindowResizerVariants },
    monaWindowResizerVariants
);

export const windowResizerThemeVariants = (theme: ThemeStyle) => windowResizerThemeVariantsStrategy.resolve(theme);

const windowTitleBarActionThemeVariantsStrategy = createThemeStrategy(
    { mona: monaWindowTitleBarActionVariants },
    monaWindowTitleBarActionVariants
);

export const windowTitleBarActionThemeVariants = (theme: ThemeStyle) =>
    windowTitleBarActionThemeVariantsStrategy.resolve(theme);

const windowTitleBarThemeVariantsStrategy = createThemeStrategy(
    { mona: monaWindowTitleBarVariants },
    monaWindowTitleBarVariants
);

export const windowTitleBarThemeVariants = (theme: ThemeStyle) => windowTitleBarThemeVariantsStrategy.resolve(theme);

const windowTitleContainerThemeVariantsStrategy = createThemeStrategy(
    { mona: monaWindowTitleContainerVariants },
    monaWindowTitleContainerVariants
);

export const windowTitleContainerThemeVariants = (theme: ThemeStyle) =>
    windowTitleContainerThemeVariantsStrategy.resolve(theme);

const windowTitleThemeVariantsStrategy = createThemeStrategy(
    { mona: monaWindowTitleVariants },
    monaWindowTitleVariants
);

export const windowTitleThemeVariants = (theme: ThemeStyle) => windowTitleThemeVariantsStrategy.resolve(theme);

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
