import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import {
    switchHandleVariants as monaSwitchHandleVariants,
    switchLabelVariants as monaSwitchLabelVariants,
    switchVariants as monaSwitchVariants
} from "./switch.mona.styles";
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
    { mona: monaSwitchVariants },
    monaSwitchVariants
);
const defaultSwitchHandleStrategy = createThemeStrategy<SwitchHandleVariantsFunction>(
    { mona: monaSwitchHandleVariants },
    monaSwitchHandleVariants
);
const defaultSwitchLabelStrategy = createThemeStrategy<SwitchLabelVariantsFunction>(
    { mona: monaSwitchLabelVariants },
    monaSwitchLabelVariants
);

export const switchThemeVariants = (theme: ThemeStyle): SwitchTrackVariantsFunction =>
    defaultSwitchTrackStrategy.resolve(theme);

export const switchHandleThemeVariants = (theme: ThemeStyle): SwitchHandleVariantsFunction =>
    defaultSwitchHandleStrategy.resolve(theme);

export const switchLabelThemeVariants = (theme: ThemeStyle): SwitchLabelVariantsFunction =>
    defaultSwitchLabelStrategy.resolve(theme);

export function createSwitchStyleStrategy(overrides: readonly SwitchStyleOverrides[] = []): SwitchStyleStrategy {
    const buildFor = (theme: ThemeStyle): SwitchVariantsFunctions => ({
        track: createSwitchTrackVariants(monaSwitchVariants, overrides, theme),
        handle: createSwitchHandleVariants(monaSwitchHandleVariants, overrides, theme),
        label: createSwitchLabelVariants(monaSwitchLabelVariants, overrides, theme)
    });
    const mona = buildFor("mona");
    const reina = buildFor("reina");
    return createThemeStrategy<SwitchVariantsFunctions>({ mona, reina }, mona);
}
