import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import { listViewBaseVariants as monaListViewBaseVariants } from "./list-view.mona.styles";

export const reinaListViewBaseVariants = createInheritedVariants(monaListViewBaseVariants, {
    add: "border-input-border",
    remove: "border-border"
});
