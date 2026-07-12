import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import {
    listBoxBaseVariants as monaListBoxBaseVariants,
    listBoxToolbarVariants as monaListBoxToolbarVariants
} from "./list-box.mona.styles";

export const reinaListBoxBaseVariants = createInheritedVariants(monaListBoxBaseVariants, {
    add: "gap-1.5",
    remove: "gap-1"
});

export const reinaListBoxToolbarVariants = createInheritedVariants(monaListBoxToolbarVariants, {
    add: "gap-1.5",
    remove: "gap-1"
});
