import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import {
    colorPaletteBaseVariants as monaColorPaletteBaseVariants,
    colorPaletteItemVariants as monaColorPaletteItemVariants
} from "./color-palette.mona.styles";

export const reinaColorPaletteBaseVariants = createInheritedVariants(monaColorPaletteBaseVariants, {
    add: "data-[disabled='true']:opacity-40 data-[invalid='true']:ring-2 data-[invalid='true']:ring-error/35",
    remove: "data-[disabled='true']:opacity-50 data-[invalid='true']:ring-1 data-[invalid='true']:ring-error"
});

export const reinaColorPaletteItemVariants = createInheritedVariants(monaColorPaletteItemVariants, {
    add: "transition-[color,box-shadow,border] ease-out duration-150 focus:not-data-[selected='true']:border-primary focus:not-data-[selected='true']:ring-2 focus:not-data-[selected='true']:ring-primary/35",
    remove: "focus:not-data-[selected='true']:border-foreground",
    variants: {
        rounded: {
            medium: {
                add: "rounded-md",
                remove: "rounded"
            }
        }
    }
});
