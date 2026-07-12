import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import {
    splitterBaseVariants as monaSplitterBaseVariants,
    splitterResizerVariants as monaSplitterResizerVariants,
    splitterResizerHandleVariants as monaSplitterResizerHandleVariants
} from "./splitter.mona.styles";

export const reinaSplitterBaseVariants = createInheritedVariants(monaSplitterBaseVariants, {});

export const reinaSplitterResizerVariants = createInheritedVariants(monaSplitterResizerVariants, {
    add: "active:bg-primary/35 transition-colors duration-150 ease-out",
    remove: "active:bg-primary/40"
});

export const reinaSplitterResizerHandleVariants = createInheritedVariants(monaSplitterResizerHandleVariants, {});
