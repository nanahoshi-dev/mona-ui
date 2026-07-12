import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import { textAreaVariants as monaTextAreaVariants } from "./textarea.mona.styles";

export const reinaTextAreaVariants = createInheritedVariants(monaTextAreaVariants, {
    add: "font-medium transition-[color,box-shadow,border,background-color] ease-out duration-150 shadow-none px-3 py-2 placeholder:text-foreground/40 disabled:opacity-40 focus-visible:ring-primary/35 [&.ng-touched.ng-invalid]:ring-error/35 data-[invalid='true']:ring-error/35",
    remove: "transition-[color,box-shadow,border] ease-in-out duration-300 shadow-xs px-2 py-1 placeholder:text-muted-foreground focus-visible:ring-primary/40 disabled:opacity-50 [&.ng-touched.ng-invalid]:ring-error/40 data-[invalid='true']:ring-error/40",
    variants: {
        rounded: {
            large: {
                add: "rounded-2xl",
                remove: "rounded-lg"
            },
            medium: {
                add: "rounded-xl",
                remove: "rounded-md"
            },
            small: {
                add: "rounded-lg",
                remove: "rounded-sm"
            }
        }
    }
});
