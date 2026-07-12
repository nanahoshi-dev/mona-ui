import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import {
    autoCompleteBaseVariants as monaAutoCompleteBaseVariants,
    autoCompleteTextInputVariants as monaAutoCompleteTextInputVariants,
    autoCompleteAffixContainerVariants as monaAutoCompleteAffixContainerVariants
} from "./auto-complete.mona.styles";

export const reinaAutoCompleteBaseVariants = createInheritedVariants(monaAutoCompleteBaseVariants, {
    add: "border-border bg-input-background focus-within:ring-2 focus-within:ring-primary/35 focus-within:border-primary transition-[color,box-shadow,border,background-color] ease-out duration-150",
    remove: "border-border-control shadow-control focus-within:border-focus-indicator focus-within:ring-2 focus-within:ring-focus-indicator/35 transition-[color,box-shadow,border-color] ease-in-out motion-reduce:transition-none",
    variants: {
        disabled: {
            true: {
                add: "opacity-40",
                remove: "opacity-50"
            }
        },
        expanded: {
            true: {
                add: "ring-2 ring-primary/35 border-primary",
                remove: "ring-2 ring-focus-indicator/35 border-focus-indicator"
            }
        },
        focused: {
            true: {
                add: "ring-2 ring-primary/35 border-primary",
                remove: "ring-2 ring-focus-indicator/35 border-focus-indicator"
            }
        },
        invalid: {
            true: {
                add: "ring-2 ring-error/35",
                remove: "ring-1 ring-error/40"
            }
        }
    }
});

export const reinaAutoCompleteTextInputVariants = createInheritedVariants(monaAutoCompleteTextInputVariants, {
    add: "placeholder:text-foreground/40"
});

export const reinaAutoCompleteAffixContainerVariants = createInheritedVariants(
    monaAutoCompleteAffixContainerVariants,
    {}
);
