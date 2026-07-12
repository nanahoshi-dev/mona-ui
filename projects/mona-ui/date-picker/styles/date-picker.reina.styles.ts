import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import { datePickerBaseVariants as monaDatePickerBaseVariants } from "./date-picker.mona.styles";

export const reinaDatePickerBaseVariants = createInheritedVariants(monaDatePickerBaseVariants, {
    add: "border-input-border bg-input-background shadow-xs transition-[color,box-shadow,border,background-color] ease-out duration-150 focus-within:ring-primary/35 data-[invalid='true']:ring-error/35",
    remove: "border-border-control shadow-control focus-within:border-focus-indicator focus-within:ring-2 focus-within:ring-focus-indicator/35 data-[invalid='true']:focus-within:border-error data-[invalid='true']:focus-within:ring-error/35",
    variants: {
        focused: {
            true: {
                add: "ring-primary/35",
                remove: "ring-focus-indicator/35 border-focus-indicator"
            }
        }
    }
});
