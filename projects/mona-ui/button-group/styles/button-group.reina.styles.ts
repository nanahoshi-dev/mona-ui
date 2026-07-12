import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import { buttonGroupVariants as monaButtonGroupVariants } from "./button-group.mona.styles";

export const reinaButtonGroupVariants = createInheritedVariants(monaButtonGroupVariants, {
    add: "bg-accent",
    remove: "border border-border shadow-xs",
    variants: {
        look: {
            ghost: {
                add: "bg-transparent p-0 gap-1.5 [&>button]:rounded-full",
                remove: "border-transparent"
            },
            outline: {
                add: "bg-transparent border border-input-border",
                remove: "[&>button:not(:last-child)]:border-r"
            }
        },
        rounded: {
            large: {
                add: "rounded-3xl [&>button]:first:rounded-ss-3xl [&>button]:first:rounded-es-3xl [&>button]:last:rounded-se-3xl [&>button]:last:rounded-ee-3xl",
                remove: "rounded-lg [&>button]:first:rounded-ss-lg [&>button]:first:rounded-es-lg [&>button]:last:rounded-se-lg [&>button]:last:rounded-ee-lg"
            },
            medium: {
                add: "rounded-2xl [&>button]:first:rounded-ss-2xl [&>button]:first:rounded-es-2xl [&>button]:last:rounded-se-2xl [&>button]:last:rounded-ee-2xl",
                remove: "rounded-md [&>button]:first:rounded-ss-md [&>button]:first:rounded-es-md [&>button]:last:rounded-se-md [&>button]:last:rounded-ee-md"
            },
            small: {
                add: "rounded-xl [&>button]:first:rounded-ss-xl [&>button]:first:rounded-es-xl [&>button]:last:rounded-se-xl [&>button]:last:rounded-ee-xl",
                remove: "rounded-sm [&>button]:first:rounded-ss-sm [&>button]:first:rounded-es-sm [&>button]:last:rounded-se-sm [&>button]:last:rounded-ee-sm"
            }
        }
    }
});
