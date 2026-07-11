import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import {
    splitterBaseVariants as monaSplitterBaseVariants,
    splitterResizerHandleVariants as monaSplitterResizerHandleVariants,
    splitterResizerVariants as monaSplitterResizerVariants
} from "./splitter.mona.styles";
import {
    reinaSplitterBaseVariants,
    reinaSplitterResizerHandleVariants,
    reinaSplitterResizerVariants
} from "./splitter.reina.styles";
import {
    createSplitterBaseVariants,
    createSplitterResizerHandleVariants,
    createSplitterResizerVariants
} from "./splitter.style-composition";
import type {
    SplitterBaseVariantsFunction,
    SplitterResizerHandleVariantsFunction,
    SplitterResizerVariantsFunction,
    SplitterStyleOverrides,
    SplitterStyleStrategy,
    SplitterVariantsFunctions
} from "./splitter.types";

const defaultSplitterBaseStrategy = createThemeStrategy<SplitterBaseVariantsFunction>(
    { mona: monaSplitterBaseVariants, reina: reinaSplitterBaseVariants },
    monaSplitterBaseVariants
);
const defaultSplitterResizerStrategy = createThemeStrategy<SplitterResizerVariantsFunction>(
    { mona: monaSplitterResizerVariants, reina: reinaSplitterResizerVariants },
    monaSplitterResizerVariants
);
const defaultSplitterResizerHandleStrategy = createThemeStrategy<SplitterResizerHandleVariantsFunction>(
    { mona: monaSplitterResizerHandleVariants, reina: reinaSplitterResizerHandleVariants },
    monaSplitterResizerHandleVariants
);

export const splitterBaseThemeVariants = (theme: ThemeStyle): SplitterBaseVariantsFunction =>
    defaultSplitterBaseStrategy.resolve(theme);
export const splitterResizerThemeVariants = (theme: ThemeStyle): SplitterResizerVariantsFunction =>
    defaultSplitterResizerStrategy.resolve(theme);
export const splitterResizerHandleThemeVariants = (theme: ThemeStyle): SplitterResizerHandleVariantsFunction =>
    defaultSplitterResizerHandleStrategy.resolve(theme);

export function createSplitterStyleStrategy(overrides: readonly SplitterStyleOverrides[] = []): SplitterStyleStrategy {
    const mona: SplitterVariantsFunctions = {
        base: createSplitterBaseVariants(monaSplitterBaseVariants, overrides, "mona"),
        resizer: createSplitterResizerVariants(monaSplitterResizerVariants, overrides, "mona"),
        resizerHandle: createSplitterResizerHandleVariants(monaSplitterResizerHandleVariants, overrides, "mona")
    };
    const reina: SplitterVariantsFunctions = {
        base: createSplitterBaseVariants(reinaSplitterBaseVariants, overrides, "reina"),
        resizer: createSplitterResizerVariants(reinaSplitterResizerVariants, overrides, "reina"),
        resizerHandle: createSplitterResizerHandleVariants(reinaSplitterResizerHandleVariants, overrides, "reina")
    };
    return createThemeStrategy<SplitterVariantsFunctions>({ mona, reina }, mona);
}
