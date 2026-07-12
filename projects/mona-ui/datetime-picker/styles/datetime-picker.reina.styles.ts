import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import {
    dateTimePickerBaseVariants as monaDateTimePickerBaseVariants,
    dateTimePickerHeaderVariants as monaDateTimePickerHeaderVariants,
    dateTimePickerFooterVariants as monaDateTimePickerFooterVariants
} from "./datetime-picker.mona.styles";

export const reinaDateTimePickerBaseVariants = createInheritedVariants(monaDateTimePickerBaseVariants, {
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

export const reinaDateTimePickerHeaderVariants = createInheritedVariants(monaDateTimePickerHeaderVariants, {
    add: "bg-accent border-input-border",
    remove: "bg-accent/20 border-border"
});

export const reinaDateTimePickerFooterVariants = createInheritedVariants(monaDateTimePickerFooterVariants, {
    add: "bg-accent border-input-border",
    remove: "bg-accent/20 border-border"
});
