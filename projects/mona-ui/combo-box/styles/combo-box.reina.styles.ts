import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import {
    comboBoxBaseVariants as monaComboBoxBaseVariants,
    comboBoxTextInputVariants as monaComboBoxTextInputVariants,
    comboBoxAffixContainerVariants as monaComboBoxAffixContainerVariants
} from "./combo-box.mona.styles";

export const reinaComboBoxBaseVariants = createInheritedVariants(monaComboBoxBaseVariants, {
    add: "border-border bg-input-background focus-within:ring-2 focus-within:ring-primary/35 focus-within:border-primary transition-[color,box-shadow,border,background-color] ease-out duration-150",
    remove: "border-input-border bg-background focus-within:ring-1 focus-within:ring-primary/40 transition-[color,box-shadow,border] ease-in-out duration-300",
    variants: {
        disabled: {
            true: {
                add: "opacity-40",
                remove: "opacity-50"
            }
        },
        focused: {
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

export const reinaComboBoxTextInputVariants = createInheritedVariants(monaComboBoxTextInputVariants, {
    add: "placeholder:text-foreground/40"
});

export const reinaComboBoxAffixContainerVariants = createInheritedVariants(monaComboBoxAffixContainerVariants, {});
