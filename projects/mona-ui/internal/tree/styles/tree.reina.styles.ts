import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import {
    subTreeListVariants as monaSubTreeListVariants,
    subTreeListItemVariants as monaSubTreeListItemVariants,
    treeBaseVariants as monaTreeBaseVariants,
    treeDropHintBaseVariants as monaTreeDropHintBaseVariants,
    treeDropHintIconVariants as monaTreeDropHintIconVariants,
    treeNodeBaseVariants as monaTreeNodeBaseVariants,
    treeNodeContainerVariants as monaTreeNodeContainerVariants,
    treeNodeDraggingVariants as monaTreeNodeDraggingVariants,
    treeNodeExpanderVariants as monaTreeNodeExpanderVariants
} from "./tree.mona.styles";

export const reinaSubTreeListVariants = createInheritedVariants(monaSubTreeListVariants, {});

export const reinaSubTreeListItemVariants = createInheritedVariants(monaSubTreeListItemVariants, {});

export const reinaTreeBaseVariants = createInheritedVariants(monaTreeBaseVariants, {});

export const reinaTreeDropHintBaseVariants = createInheritedVariants(monaTreeDropHintBaseVariants, {});

export const reinaTreeDropHintIconVariants = createInheritedVariants(monaTreeDropHintIconVariants, {});

export const reinaTreeNodeBaseVariants = createInheritedVariants(monaTreeNodeBaseVariants, {
    add: "rounded-md transition-colors ease-out duration-150",
    variants: {
        disabled: {
            true: {
                add: "opacity-40",
                remove: "opacity-50"
            }
        },
        highlighted: {
            true: {
                add: "inset-ring-primary/40",
                remove: "inset-ring-gray-400/70"
            }
        }
    }
});

export const reinaTreeNodeContainerVariants = createInheritedVariants(monaTreeNodeContainerVariants, {});

export const reinaTreeNodeDraggingVariants = createInheritedVariants(monaTreeNodeDraggingVariants, {
    add: "border-input-border! rounded-md!",
    remove: "border-border!"
});

export const reinaTreeNodeExpanderVariants = createInheritedVariants(monaTreeNodeExpanderVariants, {});
