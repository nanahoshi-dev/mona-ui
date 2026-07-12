import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import {
    radioButtonVariants as monaRadioButtonVariants,
    radioButtonCircleVariants as monaRadioButtonCircleVariants,
    radioButtonIndicatorVariants as monaRadioButtonIndicatorVariants,
    radioButtonContainerLabelVariants as monaRadioButtonContainerLabelVariants,
    radioButtonDirectiveVariants as monaRadioButtonDirectiveVariants
} from "./radio.mona.styles";

export const reinaRadioButtonVariants = createInheritedVariants(monaRadioButtonVariants, {});

export const reinaRadioButtonCircleVariants = createInheritedVariants(monaRadioButtonCircleVariants, {
    add: "duration-150 ease-out peer-focus:ring-primary/35 peer-disabled:opacity-40 data-[invalid='true']:ring-error/35",
    remove: "duration-200 peer-focus:ring-primary/40 peer-disabled:opacity-50 data-[invalid='true']:ring-error/40"
});

export const reinaRadioButtonIndicatorVariants = createInheritedVariants(monaRadioButtonIndicatorVariants, {
    add: "duration-150 ease-out",
    remove: "duration-200"
});

export const reinaRadioButtonContainerLabelVariants = createInheritedVariants(monaRadioButtonContainerLabelVariants, {
    add: "data-[disabled='true']:opacity-40",
    remove: "data-[disabled='true']:opacity-50"
});

export const reinaRadioButtonDirectiveVariants = createInheritedVariants(monaRadioButtonDirectiveVariants, {
    add: "transition-colors duration-150 ease-out disabled:opacity-40 checked:border-primary focus-visible:ring-primary/35",
    remove: "disabled:opacity-50 focus-visible:ring-primary/40"
});
