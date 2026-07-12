import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import {
    stepperBaseVariants as monaStepperBaseVariants,
    stepperStepListVariants as monaStepperStepListVariants,
    stepperStepListItemVariants as monaStepperStepListItemVariants,
    stepperStepIndicatorVariants as monaStepperStepIndicatorVariants,
    stepperTrackVariants as monaStepperTrackVariants,
    stepperTrackLineVariants as monaStepperTrackLineVariants
} from "./stepper.mona.styles";

export const reinaStepperBaseVariants = createInheritedVariants(monaStepperBaseVariants, {});

export const reinaStepperStepListVariants = createInheritedVariants(monaStepperStepListVariants, {});

export const reinaStepperStepListItemVariants = createInheritedVariants(monaStepperStepListItemVariants, {});

export const reinaStepperStepIndicatorVariants = createInheritedVariants(monaStepperStepIndicatorVariants, {
    add: "bg-input-background border-input-border duration-150 ease-out",
    remove: "bg-surface border-border duration-400 ease-in-out",
    variants: {
        focused: {
            true: {
                add: "ring-primary/35",
                remove: "ring-primary/40"
            }
        }
    }
});

export const reinaStepperTrackVariants = createInheritedVariants(monaStepperTrackVariants, {
    add: "bg-input-background border-input-border",
    remove: "bg-surface border-border"
});

export const reinaStepperTrackLineVariants = createInheritedVariants(monaStepperTrackLineVariants, {
    variants: {
        orientation: {
            horizontal: {
                add: "duration-150",
                remove: "duration-300"
            },
            vertical: {
                add: "duration-150",
                remove: "duration-300"
            }
        }
    }
});
