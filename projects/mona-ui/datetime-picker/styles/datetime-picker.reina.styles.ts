import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import {
    dateTimePickerBaseVariants as monaDateTimePickerBaseVariants,
    dateTimePickerHeaderVariants as monaDateTimePickerHeaderVariants,
    dateTimePickerFooterVariants as monaDateTimePickerFooterVariants
} from "./datetime-picker.mona.styles";

export const reinaDateTimePickerBaseVariants = createInheritedVariants(monaDateTimePickerBaseVariants, {
    add: "border-input-border bg-input-background shadow-xs transition-[color,box-shadow,border,background-color] ease-out duration-150 focus-within:ring-primary/35 data-[invalid='true']:ring-error/35",
    remove: "border-border focus-within:ring-primary/40 data-[invalid='true']:ring-error/40",
    variants: {
        focused: {
            true: {
                add: "ring-primary/35",
                remove: "ring-primary/40"
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
