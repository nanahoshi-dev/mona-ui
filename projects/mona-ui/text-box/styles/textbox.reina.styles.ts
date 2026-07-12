import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import { textBoxVariants as monaTextBoxVariants, inputVariants as monaInputVariants } from "./textbox.mona.styles";

export const reinaTextBoxVariants = createInheritedVariants(monaTextBoxVariants, {
    add: "font-medium transition-[color,box-shadow,border,background-color] ease-out duration-150 data-[disabled='true']:opacity-40 focus-within:ring-primary/35 [&>input]:placeholder:text-foreground/40 [&>input]:px-3 data-[invalid='true']:ring-error/35",
    remove: "transition-[color,box-shadow,border] ease-in-out duration-300 data-[disabled='true']:opacity-50 focus-within:ring-primary/40 [&>input]:placeholder:text-muted-foreground [&>input]:px-2 data-[invalid='true']:ring-error/40",
    defaultVariants: {
        size: "medium"
    }
});

export const reinaInputVariants = createInheritedVariants(monaInputVariants, {
    add: "px-3 font-medium transition-[color,box-shadow,border,background-color] ease-out duration-150 shadow-none placeholder:text-foreground/40 disabled:opacity-40 focus-visible:ring-primary/35 [&.ng-touched.ng-invalid]:ring-error/35",
    remove: "px-2 transition-[color,box-shadow,border] ease-in-out duration-300 shadow-xs placeholder:text-muted-foreground disabled:opacity-50 focus-visible:ring-primary/40 [&.ng-touched.ng-invalid]:ring-error/40",
    defaultVariants: {
        size: "medium"
    }
});
