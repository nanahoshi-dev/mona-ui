import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import {
    checkboxVariants as monaCheckboxVariants,
    checkmarkVariants as monaCheckmarkVariants,
    checkboxContainerLabelVariants as monaCheckboxContainerLabelVariants,
    checkboxDirectiveVariants as monaCheckboxDirectiveVariants
} from "./checkbox.mona.styles";

export const reinaCheckboxVariants = createInheritedVariants(monaCheckboxVariants, {});

export const reinaCheckmarkVariants = createInheritedVariants(monaCheckmarkVariants, {
    add: "transition-colors duration-150 ease-out data-[disabled='true']:opacity-40 peer-focus-visible:ring-primary/35 peer-checked:border-primary peer-indeterminate:border-primary data-[invalid='true']:ring-error/35",
    remove: "data-[disabled='true']:opacity-50 peer-focus-visible:ring-primary/40 data-[invalid='true']:ring-error/40"
});

export const reinaCheckboxContainerLabelVariants = createInheritedVariants(monaCheckboxContainerLabelVariants, {
    add: "data-[disabled='true']:opacity-40",
    remove: "data-[disabled='true']:opacity-50"
});

export const reinaCheckboxDirectiveVariants = createInheritedVariants(monaCheckboxDirectiveVariants, {
    add: "transition-colors duration-150 ease-out disabled:opacity-40 indeterminate:border-primary checked:border-primary focus-visible:ring-primary/35",
    remove: "disabled:opacity-50 focus-visible:ring-primary/40"
});
