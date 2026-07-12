import { type ThemeStyle, createInheritedThemeStrategy } from "@nanahoshi/mona-ui/theme";
import {
    sliderBaseVariants as monaSliderBaseVariants,
    sliderHandleVariants as monaSliderHandleVariants,
    sliderSelectionVariants as monaSliderSelectionVariants,
    sliderTickLabelListVariants as monaSliderTickLabelListVariants,
    sliderTickLabelVariants as monaSliderTickLabelVariants,
    sliderTickListVariants as monaSliderTickListVariants,
    sliderTickVariants as monaSliderTickVariants,
    sliderTrackVariants as monaSliderTrackVariants
} from "./slider.mona.styles";
import {
    reinaSliderBaseVariants,
    reinaSliderHandleVariants,
    reinaSliderSelectionVariants,
    reinaSliderTickLabelListVariants,
    reinaSliderTickLabelVariants,
    reinaSliderTickListVariants,
    reinaSliderTickVariants,
    reinaSliderTrackVariants
} from "./slider.reina.styles";
import {
    createSliderBaseVariants,
    createSliderHandleVariants,
    createSliderSelectionVariants,
    createSliderTickLabelListVariants,
    createSliderTickLabelVariants,
    createSliderTickListVariants,
    createSliderTickVariants,
    createSliderTrackVariants
} from "./slider.style-composition";
import type {
    SliderBaseVariantsFunction,
    SliderHandleVariantsFunction,
    SliderSelectionVariantsFunction,
    SliderStyleOverrides,
    SliderStyleStrategy,
    SliderTickLabelListVariantsFunction,
    SliderTickLabelVariantsFunction,
    SliderTickListVariantsFunction,
    SliderTickVariantsFunction,
    SliderTrackVariantsFunction,
    SliderVariantsFunctions
} from "./slider.types";

const defaultSliderBaseStrategy = createInheritedThemeStrategy<SliderBaseVariantsFunction>(monaSliderBaseVariants, {
    reina: reinaSliderBaseVariants
});
const defaultSliderTrackStrategy = createInheritedThemeStrategy<SliderTrackVariantsFunction>(monaSliderTrackVariants, {
    reina: reinaSliderTrackVariants
});
const defaultSliderSelectionStrategy = createInheritedThemeStrategy<SliderSelectionVariantsFunction>(
    monaSliderSelectionVariants,
    { reina: reinaSliderSelectionVariants }
);
const defaultSliderTickListStrategy = createInheritedThemeStrategy<SliderTickListVariantsFunction>(
    monaSliderTickListVariants,
    { reina: reinaSliderTickListVariants }
);
const defaultSliderTickStrategy = createInheritedThemeStrategy<SliderTickVariantsFunction>(monaSliderTickVariants, {
    reina: reinaSliderTickVariants
});
const defaultSliderTickLabelListStrategy = createInheritedThemeStrategy<SliderTickLabelListVariantsFunction>(
    monaSliderTickLabelListVariants,
    { reina: reinaSliderTickLabelListVariants }
);
const defaultSliderTickLabelStrategy = createInheritedThemeStrategy<SliderTickLabelVariantsFunction>(
    monaSliderTickLabelVariants,
    { reina: reinaSliderTickLabelVariants }
);
const defaultSliderHandleStrategy = createInheritedThemeStrategy<SliderHandleVariantsFunction>(
    monaSliderHandleVariants,
    { reina: reinaSliderHandleVariants }
);

export const sliderBaseThemeVariants = (theme: ThemeStyle): SliderBaseVariantsFunction =>
    defaultSliderBaseStrategy.resolve(theme);
export const sliderTrackThemeVariants = (theme: ThemeStyle): SliderTrackVariantsFunction =>
    defaultSliderTrackStrategy.resolve(theme);
export const sliderSelectionThemeVariants = (theme: ThemeStyle): SliderSelectionVariantsFunction =>
    defaultSliderSelectionStrategy.resolve(theme);
export const sliderTickListThemeVariants = (theme: ThemeStyle): SliderTickListVariantsFunction =>
    defaultSliderTickListStrategy.resolve(theme);
export const sliderTickThemeVariants = (theme: ThemeStyle): SliderTickVariantsFunction =>
    defaultSliderTickStrategy.resolve(theme);
export const sliderTickLabelListThemeVariants = (theme: ThemeStyle): SliderTickLabelListVariantsFunction =>
    defaultSliderTickLabelListStrategy.resolve(theme);
export const sliderTickLabelThemeVariants = (theme: ThemeStyle): SliderTickLabelVariantsFunction =>
    defaultSliderTickLabelStrategy.resolve(theme);
export const sliderHandleThemeVariants = (theme: ThemeStyle): SliderHandleVariantsFunction =>
    defaultSliderHandleStrategy.resolve(theme);

export function createSliderStyleStrategy(overrides: readonly SliderStyleOverrides[] = []): SliderStyleStrategy {
    const mona: SliderVariantsFunctions = {
        base: createSliderBaseVariants(monaSliderBaseVariants, overrides, "mona"),
        handle: createSliderHandleVariants(monaSliderHandleVariants, overrides, "mona"),
        selection: createSliderSelectionVariants(monaSliderSelectionVariants, overrides, "mona"),
        tick: createSliderTickVariants(monaSliderTickVariants, overrides, "mona"),
        tickLabel: createSliderTickLabelVariants(monaSliderTickLabelVariants, overrides, "mona"),
        tickLabelList: createSliderTickLabelListVariants(monaSliderTickLabelListVariants, overrides, "mona"),
        tickList: createSliderTickListVariants(monaSliderTickListVariants, overrides, "mona"),
        track: createSliderTrackVariants(monaSliderTrackVariants, overrides, "mona")
    };
    const reina: SliderVariantsFunctions = {
        base: createSliderBaseVariants(reinaSliderBaseVariants, overrides, "reina"),
        handle: createSliderHandleVariants(reinaSliderHandleVariants, overrides, "reina"),
        selection: createSliderSelectionVariants(reinaSliderSelectionVariants, overrides, "reina"),
        tick: createSliderTickVariants(reinaSliderTickVariants, overrides, "reina"),
        tickLabel: createSliderTickLabelVariants(reinaSliderTickLabelVariants, overrides, "reina"),
        tickLabelList: createSliderTickLabelListVariants(reinaSliderTickLabelListVariants, overrides, "reina"),
        tickList: createSliderTickListVariants(reinaSliderTickListVariants, overrides, "reina"),
        track: createSliderTrackVariants(reinaSliderTrackVariants, overrides, "reina")
    };
    return createInheritedThemeStrategy<SliderVariantsFunctions>(mona, { reina: reina });
}
