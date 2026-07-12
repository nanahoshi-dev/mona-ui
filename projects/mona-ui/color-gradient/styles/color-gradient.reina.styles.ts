import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import {
    colorGradientBaseVariants as monaColorGradientBaseVariants,
    colorGradientHsvRectangleVariants as monaColorGradientHsvRectangleVariants,
    colorGradientHsvRectangleHandleVariants as monaColorGradientHsvRectangleHandleVariants,
    colorGradientPreviewVariants as monaColorGradientPreviewVariants,
    colorGradientSliderHandleVariants as monaColorGradientSliderHandleVariants
} from "./color-gradient.mona.styles";

export const reinaColorGradientBaseVariants = createInheritedVariants(monaColorGradientBaseVariants, {
    add: "data-[disabled='true']:opacity-40 data-[invalid='true']:ring-2 data-[invalid='true']:ring-error/35",
    remove: "data-[disabled='true']:opacity-50 data-[invalid='true']:ring-1 data-[invalid='true']:ring-error"
});

export const reinaColorGradientHsvRectangleVariants = createInheritedVariants(monaColorGradientHsvRectangleVariants, {
    add: "border-input-border",
    remove: "border-border"
});

export const reinaColorGradientHsvRectangleHandleVariants = createInheritedVariants(
    monaColorGradientHsvRectangleHandleVariants,
    {
        add: "focus-visible:ring-primary/35",
        remove: "focus-visible:ring-primary/40"
    }
);

export const reinaColorGradientPreviewVariants = createInheritedVariants(monaColorGradientPreviewVariants, {
    add: "border-input-border",
    remove: "border-border"
});

export const reinaColorGradientSliderHandleVariants = createInheritedVariants(
    monaColorGradientSliderHandleVariants,
    {}
);
