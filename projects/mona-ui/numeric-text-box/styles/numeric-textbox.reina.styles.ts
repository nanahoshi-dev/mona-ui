import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import {
    numericTextboxVariants as monaNumericTextboxVariants,
    numericTextboxInputVariants as monaNumericTextboxInputVariants,
    numericTextboxButtonVariants as monaNumericTextboxButtonVariants
} from "./numeric-textbox.mona.styles";

export const reinaNumericTextboxVariants = createInheritedVariants(monaNumericTextboxVariants, {
    add: "placeholder:text-foreground/40 transition-[color,box-shadow,border,background-color] ease-out duration-150 data-[disabled='true']:opacity-40 focus-within:ring-primary/35 data-[invalid='true']:ring-error/35",
    remove: "placeholder:text-muted-foreground transition-[color,box-shadow,border] ease-in-out duration-300 data-[disabled='true']:opacity-50 focus-within:ring-primary/40 data-[invalid='true']:ring-error/40"
});

export const reinaNumericTextboxInputVariants = createInheritedVariants(monaNumericTextboxInputVariants, {
    add: "font-medium",
    variants: {
        leftRounded: {
            large: {
                add: "rounded-tl-3xl rounded-bl-3xl",
                remove: "rounded-tl-lg rounded-bl-lg"
            },
            medium: {
                add: "rounded-tl-2xl rounded-bl-2xl",
                remove: "rounded-tl-md rounded-bl-md"
            },
            small: {
                add: "rounded-tl-xl rounded-bl-xl",
                remove: "rounded-tl-sm rounded-bl-sm"
            }
        },
        rightRounded: {
            large: {
                add: "rounded-tr-3xl rounded-br-3xl",
                remove: "rounded-tr-lg rounded-br-lg"
            },
            medium: {
                add: "rounded-tr-2xl rounded-br-2xl",
                remove: "rounded-tr-md rounded-br-md"
            },
            small: {
                add: "rounded-tr-xl rounded-br-xl",
                remove: "rounded-tr-sm rounded-br-sm"
            }
        }
    }
});

export const reinaNumericTextboxButtonVariants = createInheritedVariants(monaNumericTextboxButtonVariants, {
    variants: {
        size: {
            large: {
                add: "min-w-12 w-12",
                remove: "min-w-16 w-16"
            }
        }
    }
});
