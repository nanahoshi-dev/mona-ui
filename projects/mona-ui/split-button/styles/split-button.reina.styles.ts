import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import { splitButtonVariants as monaSplitButtonVariants } from "./split-button.mona.styles";

export const reinaSplitButtonVariants = createInheritedVariants(monaSplitButtonVariants, {
    variants: {
        rounded: {
            large: {
                add: "rounded-3xl [&>button]:first:rounded-tl-3xl [&>button]:first:rounded-bl-3xl [&>button]:last:rounded-tr-3xl [&>button]:last:rounded-br-3xl",
                remove: "rounded-lg [&>button]:first:rounded-tl-lg [&>button]:first:rounded-bl-lg [&>button]:last:rounded-tr-lg [&>button]:last:rounded-br-lg"
            },
            medium: {
                add: "rounded-2xl [&>button]:first:rounded-tl-2xl [&>button]:first:rounded-bl-2xl [&>button]:last:rounded-tr-2xl [&>button]:last:rounded-br-2xl",
                remove: "rounded-md [&>button]:first:rounded-tl-md [&>button]:first:rounded-bl-md [&>button]:last:rounded-tr-md [&>button]:last:rounded-br-md"
            },
            small: {
                add: "rounded-xl [&>button]:first:rounded-tl-xl [&>button]:first:rounded-bl-xl [&>button]:last:rounded-tr-xl [&>button]:last:rounded-br-xl",
                remove: "rounded-sm [&>button]:first:rounded-tl-sm [&>button]:first:rounded-bl-sm [&>button]:last:rounded-tr-sm [&>button]:last:rounded-br-sm"
            }
        }
    }
});
