import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import {
    switchHandleVariants as monaSwitchHandleVariants,
    switchLabelVariants as monaSwitchLabelVariants,
    switchVariants as monaSwitchVariants
} from "./switch.mona.styles";
import {
    reinaSwitchHandleVariants,
    reinaSwitchLabelVariants,
    reinaSwitchVariants
} from "./switch.reina.styles";
import { createSwitchHandleVariants, createSwitchLabelVariants, createSwitchTrackVariants } from "./switch.style-composition";
import type {
    SwitchHandleVariantsFunction,
    SwitchLabelVariantsFunction,
    SwitchStyleOverrides,
    SwitchStyleStrategy,
    SwitchTrackVariantsFunction,
    SwitchVariantsFunctions
} from "./switch.types";

const defaultSwitchTrackStrategy = createThemeStrategy<SwitchTrackVariantsFunction>(
    { mona: monaSwitchVariants, reina: reinaSwitchVariants },
    monaSwitchVariants
);
const defaultSwitchHandleStrategy = createThemeStrategy<SwitchHandleVariantsFunction>(
    { mona: monaSwitchHandleVariants, reina: reinaSwitchHandleVariants },
    monaSwitchHandleVariants
);
const defaultSwitchLabelStrategy = createThemeStrategy<SwitchLabelVariantsFunction>(
    { mona: monaSwitchLabelVariants, reina: reinaSwitchLabelVariants },
    monaSwitchLabelVariants
);

export const switchThemeVariants = (theme: ThemeStyle): SwitchTrackVariantsFunction =>
    defaultSwitchTrackStrategy.resolve(theme);

export const switchHandleThemeVariants = (theme: ThemeStyle): SwitchHandleVariantsFunction =>
    defaultSwitchHandleStrategy.resolve(theme);

export const switchLabelThemeVariants = (theme: ThemeStyle): SwitchLabelVariantsFunction =>
    defaultSwitchLabelStrategy.resolve(theme);

export function createSwitchStyleStrategy(overrides: readonly SwitchStyleOverrides[] = []): SwitchStyleStrategy {
    const mona: SwitchVariantsFunctions = {
        track: createSwitchTrackVariants(monaSwitchVariants, overrides, "mona"),
        handle: createSwitchHandleVariants(monaSwitchHandleVariants, overrides, "mona"),
        label: createSwitchLabelVariants(monaSwitchLabelVariants, overrides, "mona")
    };
    const reina: SwitchVariantsFunctions = {
        track: createSwitchTrackVariants(reinaSwitchVariants, overrides, "reina"),
        handle: createSwitchHandleVariants(reinaSwitchHandleVariants, overrides, "reina"),
        label: createSwitchLabelVariants(reinaSwitchLabelVariants, overrides, "reina")
    };
    return createThemeStrategy<SwitchVariantsFunctions>({ mona, reina }, mona);
}
