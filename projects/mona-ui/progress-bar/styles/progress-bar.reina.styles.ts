import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import {
    progressBarBaseVariants as monaProgressBarBaseVariants,
    progressBarIndeterminateVariants as monaProgressBarIndeterminateVariants,
    progressBarLabelVariants as monaProgressBarLabelVariants,
    progressBarTrackVariants as monaProgressBarTrackVariants
} from "./progress-bar.mona.styles";

export const reinaProgressBarBaseVariants = createInheritedVariants(monaProgressBarBaseVariants, {
    add: "data-[disabled='true']:opacity-40",
    remove: "data-[disabled='true']:opacity-50"
});

export const reinaProgressBarIndeterminateVariants = createInheritedVariants(monaProgressBarIndeterminateVariants, {});

export const reinaProgressBarLabelVariants = createInheritedVariants(monaProgressBarLabelVariants, {});

export const reinaProgressBarTrackVariants = createInheritedVariants(monaProgressBarTrackVariants, {
    add: "data-[prev='true']:duration-150 data-[prev='true']:ease-out data-[next='true']:duration-150 data-[next='true']:ease-out",
    remove: "data-[prev='true']:duration-200 data-[prev='true']:ease-in data-[next='true']:duration-200 data-[next='true']:ease-in"
});
