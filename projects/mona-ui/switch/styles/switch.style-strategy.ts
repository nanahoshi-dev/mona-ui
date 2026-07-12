import { type ThemeStyle, createInheritedThemeStrategy } from "@nanahoshi/mona-ui/theme";
import {
    switchHandleVariants as monaSwitchHandleVariants,
    switchLabelVariants as monaSwitchLabelVariants,
    switchVariants as monaSwitchVariants
} from "./switch.mona.styles";
import { reinaSwitchHandleVariants, reinaSwitchLabelVariants, reinaSwitchVariants } from "./switch.reina.styles";
import {
    createSwitchHandleVariants,
    createSwitchLabelVariants,
    createSwitchTrackVariants
} from "./switch.style-composition";
import type {
    SwitchHandleVariantsFunction,
    SwitchLabelVariantsFunction,
    SwitchStyleOverrides,
    SwitchStyleStrategy,
    SwitchTrackVariantsFunction,
    SwitchVariantsFunctions
} from "./switch.types";

const defaultSwitchTrackStrategy = createInheritedThemeStrategy<SwitchTrackVariantsFunction>(monaSwitchVariants, {
    reina: reinaSwitchVariants
});
const defaultSwitchHandleStrategy = createInheritedThemeStrategy<SwitchHandleVariantsFunction>(
    monaSwitchHandleVariants,
    { reina: reinaSwitchHandleVariants }
);
const defaultSwitchLabelStrategy = createInheritedThemeStrategy<SwitchLabelVariantsFunction>(monaSwitchLabelVariants, {
    reina: reinaSwitchLabelVariants
});

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
    return createInheritedThemeStrategy<SwitchVariantsFunctions>(mona, { reina: reina });
}
