import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import {
    dropdownListInputVariants as monaDropdownListInputVariants,
    dropdownListValueContainerVariants as monaDropdownListValueContainerVariants,
    dropdownListAffixContainerVariants as monaDropdownListAffixContainerVariants
} from "./dropdown-list.mona.styles";

export const reinaDropdownListInputVariants = createInheritedVariants(monaDropdownListInputVariants, {
    add: "border-border hover:bg-hover transition-[color,box-shadow,border,background-color] ease-out duration-150 focus-within:ring-2 focus-within:ring-primary/35 focus-within:border-primary",
    remove: "border-input-border hover:bg-accent hover:text-accent-foreground transition-[color,box-shadow,border] ease-in-out duration-300 focus-within:ring-1 focus-within:ring-primary/40",
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
                remove: "ring-1 ring-primary/40"
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

export const reinaDropdownListValueContainerVariants = createInheritedVariants(
    monaDropdownListValueContainerVariants,
    {}
);

export const reinaDropdownListAffixContainerVariants = createInheritedVariants(
    monaDropdownListAffixContainerVariants,
    {}
);
