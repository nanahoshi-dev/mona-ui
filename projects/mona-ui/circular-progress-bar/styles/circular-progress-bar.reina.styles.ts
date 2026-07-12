import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import { circularProgressBarBaseVariants as monaCircularProgressBarBaseVariants } from "./circular-progress-bar.mona.styles";

export const reinaCircularProgressBarBaseVariants = createInheritedVariants(monaCircularProgressBarBaseVariants, {
    add: "duration-150 ease-out",
    remove: "duration-200 ease-in",
    variants: {
        disabled: {
            true: {
                add: "opacity-40",
                remove: "opacity-50"
            }
        }
    }
});
