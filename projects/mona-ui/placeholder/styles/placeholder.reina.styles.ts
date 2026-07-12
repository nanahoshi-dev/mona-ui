import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import {
    placeholderBaseVariants as monaPlaceholderBaseVariants,
    placeholderTextVariants as monaPlaceholderTextVariants
} from "./placeholder.mona.styles";

export const reinaPlaceholderBaseVariants = createInheritedVariants(monaPlaceholderBaseVariants, {});

export const reinaPlaceholderTextVariants = createInheritedVariants(monaPlaceholderTextVariants, {
    add: "text-foreground/35 font-medium tracking-wide",
    remove: "text-muted-foreground uppercase"
});
