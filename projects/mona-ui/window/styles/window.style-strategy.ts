import { type ThemeStyle, createInheritedThemeStrategy } from "@nanahoshi/mona-ui/theme";
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
import {
    reinaWindowBaseVariants,
    reinaWindowContentContainerVariants,
    reinaWindowContentVariants,
    reinaWindowResizerVariants,
    reinaWindowTitleBarActionVariants,
    reinaWindowTitleBarVariants,
    reinaWindowTitleContainerVariants,
    reinaWindowTitleVariants
} from "./window.reina.styles";
import {
    createWindowBaseVariants,
    createWindowContentContainerVariants,
    createWindowContentVariants,
    createWindowResizerVariants,
    createWindowTitleBarActionVariants,
    createWindowTitleBarVariants,
    createWindowTitleContainerVariants,
    createWindowTitleVariants
} from "./window.style-composition";
import type {
    WindowBaseVariantsFunction,
    WindowContentContainerVariantsFunction,
    WindowContentVariantsFunction,
    WindowResizerVariantsFunction,
    WindowStyleOverrides,
    WindowStyleStrategy,
    WindowTitleBarActionVariantsFunction,
    WindowTitleBarVariantsFunction,
    WindowTitleContainerVariantsFunction,
    WindowTitleVariantsFunction,
    WindowVariantsFunctions
} from "./window.types";

const defaultWindowBaseStrategy = createInheritedThemeStrategy<WindowBaseVariantsFunction>(monaWindowBaseVariants, {
    reina: reinaWindowBaseVariants
});
const defaultWindowContentContainerStrategy = createInheritedThemeStrategy<WindowContentContainerVariantsFunction>(
    monaWindowContentContainerVariants,
    { reina: reinaWindowContentContainerVariants }
);
const defaultWindowContentStrategy = createInheritedThemeStrategy<WindowContentVariantsFunction>(
    monaWindowContentVariants,
    { reina: reinaWindowContentVariants }
);
const defaultWindowResizerStrategy = createInheritedThemeStrategy<WindowResizerVariantsFunction>(
    monaWindowResizerVariants,
    { reina: reinaWindowResizerVariants }
);
const defaultWindowTitleBarActionStrategy = createInheritedThemeStrategy<WindowTitleBarActionVariantsFunction>(
    monaWindowTitleBarActionVariants,
    { reina: reinaWindowTitleBarActionVariants }
);
const defaultWindowTitleBarStrategy = createInheritedThemeStrategy<WindowTitleBarVariantsFunction>(
    monaWindowTitleBarVariants,
    { reina: reinaWindowTitleBarVariants }
);
const defaultWindowTitleContainerStrategy = createInheritedThemeStrategy<WindowTitleContainerVariantsFunction>(
    monaWindowTitleContainerVariants,
    { reina: reinaWindowTitleContainerVariants }
);
const defaultWindowTitleStrategy = createInheritedThemeStrategy<WindowTitleVariantsFunction>(monaWindowTitleVariants, {
    reina: reinaWindowTitleVariants
});

export const windowBaseThemeVariants = (theme: ThemeStyle): WindowBaseVariantsFunction =>
    defaultWindowBaseStrategy.resolve(theme);
export const windowContentContainerThemeVariants = (theme: ThemeStyle): WindowContentContainerVariantsFunction =>
    defaultWindowContentContainerStrategy.resolve(theme);
export const windowContentThemeVariants = (theme: ThemeStyle): WindowContentVariantsFunction =>
    defaultWindowContentStrategy.resolve(theme);
export const windowResizerThemeVariants = (theme: ThemeStyle): WindowResizerVariantsFunction =>
    defaultWindowResizerStrategy.resolve(theme);
export const windowTitleBarActionThemeVariants = (theme: ThemeStyle): WindowTitleBarActionVariantsFunction =>
    defaultWindowTitleBarActionStrategy.resolve(theme);
export const windowTitleBarThemeVariants = (theme: ThemeStyle): WindowTitleBarVariantsFunction =>
    defaultWindowTitleBarStrategy.resolve(theme);
export const windowTitleContainerThemeVariants = (theme: ThemeStyle): WindowTitleContainerVariantsFunction =>
    defaultWindowTitleContainerStrategy.resolve(theme);
export const windowTitleThemeVariants = (theme: ThemeStyle): WindowTitleVariantsFunction =>
    defaultWindowTitleStrategy.resolve(theme);

export function createWindowStyleStrategy(overrides: readonly WindowStyleOverrides[] = []): WindowStyleStrategy {
    const mona: WindowVariantsFunctions = {
        base: createWindowBaseVariants(monaWindowBaseVariants, overrides, "mona"),
        content: createWindowContentVariants(monaWindowContentVariants, overrides, "mona"),
        contentContainer: createWindowContentContainerVariants(monaWindowContentContainerVariants, overrides, "mona"),
        resizer: createWindowResizerVariants(monaWindowResizerVariants, overrides, "mona"),
        title: createWindowTitleVariants(monaWindowTitleVariants, overrides, "mona"),
        titleBar: createWindowTitleBarVariants(monaWindowTitleBarVariants, overrides, "mona"),
        titleBarAction: createWindowTitleBarActionVariants(monaWindowTitleBarActionVariants, overrides, "mona"),
        titleContainer: createWindowTitleContainerVariants(monaWindowTitleContainerVariants, overrides, "mona")
    };
    const reina: WindowVariantsFunctions = {
        base: createWindowBaseVariants(reinaWindowBaseVariants, overrides, "reina"),
        content: createWindowContentVariants(reinaWindowContentVariants, overrides, "reina"),
        contentContainer: createWindowContentContainerVariants(reinaWindowContentContainerVariants, overrides, "reina"),
        resizer: createWindowResizerVariants(reinaWindowResizerVariants, overrides, "reina"),
        title: createWindowTitleVariants(reinaWindowTitleVariants, overrides, "reina"),
        titleBar: createWindowTitleBarVariants(reinaWindowTitleBarVariants, overrides, "reina"),
        titleBarAction: createWindowTitleBarActionVariants(reinaWindowTitleBarActionVariants, overrides, "reina"),
        titleContainer: createWindowTitleContainerVariants(reinaWindowTitleContainerVariants, overrides, "reina")
    };
    return createInheritedThemeStrategy<WindowVariantsFunctions>(mona, { reina: reina });
}
