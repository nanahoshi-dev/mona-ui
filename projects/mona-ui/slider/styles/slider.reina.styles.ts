import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import {
    sliderBaseVariants as monaSliderBaseVariants,
    sliderTrackVariants as monaSliderTrackVariants,
    sliderSelectionVariants as monaSliderSelectionVariants,
    sliderTickListVariants as monaSliderTickListVariants,
    sliderTickVariants as monaSliderTickVariants,
    sliderTickLabelListVariants as monaSliderTickLabelListVariants,
    sliderTickLabelVariants as monaSliderTickLabelVariants,
    sliderHandleVariants as monaSliderHandleVariants
} from "./slider.mona.styles";

export const reinaSliderBaseVariants = createInheritedVariants(monaSliderBaseVariants, {
    add: 'data-[disabled="true"]:opacity-40',
    remove: 'data-[disabled="true"]:opacity-50'
});

export const reinaSliderTrackVariants = createInheritedVariants(monaSliderTrackVariants, {
    add: "bg-input-background",
    remove: "bg-input-background"
});

export const reinaSliderSelectionVariants = createInheritedVariants(monaSliderSelectionVariants, {
    add: "duration-150",
    remove: "duration-200"
});

export const reinaSliderTickListVariants = createInheritedVariants(monaSliderTickListVariants, {});

export const reinaSliderTickVariants = createInheritedVariants(monaSliderTickVariants, {
    remove: "brightness-75"
});

export const reinaSliderTickLabelListVariants = createInheritedVariants(monaSliderTickLabelListVariants, {});

export const reinaSliderTickLabelVariants = createInheritedVariants(monaSliderTickLabelVariants, {});

export const reinaSliderHandleVariants = createInheritedVariants(monaSliderHandleVariants, {
    add: 'duration-150 data-[focused="true"]:ring-primary/35 data-[invalid="true"]:ring-error/35',
    remove: 'duration-200 data-[focused="true"]:ring-primary/40 data-[invalid="true"]:ring-error/40'
});
