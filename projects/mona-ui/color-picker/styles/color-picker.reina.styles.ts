import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import {
    colorPickerBaseVariants as monaColorPickerBaseVariants,
    colorPickerColorVariants as monaColorPickerColorVariants
} from "./color-picker.mona.styles";

export const reinaColorPickerBaseVariants = createInheritedVariants(monaColorPickerBaseVariants, {
    add: "hover:bg-input-hover transition-[color,box-shadow,border,background-color] ease-out duration-150 data-[disabled='true']:opacity-40 data-[invalid='true']:ring-2 data-[invalid='true']:ring-error/35 focus-within:ring-2 focus-within:ring-primary/35 focus-within:border-primary",
    remove: "hover:bg-accent hover:text-accent-foreground transition-[color,box-shadow,border] ease-in-out duration-300 data-[disabled='true']:opacity-50 data-[invalid='true']:ring-1 data-[invalid='true']:ring-error focus-within:ring-1 focus-within:ring-primary/40",
    variants: {
        expanded: {
            true: {
                add: "ring-2 ring-primary/35 border-primary",
                remove: "ring-1 ring-primary/40"
            }
        }
    }
});

export const reinaColorPickerColorVariants = createInheritedVariants(monaColorPickerColorVariants, {});
