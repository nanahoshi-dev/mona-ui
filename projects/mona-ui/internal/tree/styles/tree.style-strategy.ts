import { createThemeStrategy } from "@nanahoshi/mona-ui/theme";
import {
    subTreeListItemVariants as monaSubTreeListItemVariants,
    subTreeListVariants as monaSubTreeListVariants,
    treeBaseVariants as monaTreeBaseVariants,
    treeDropHintBaseVariants as monaTreeDropHintBaseVariants,
    treeDropHintIconVariants as monaTreeDropHintIconVariants,
    treeNodeBaseVariants as monaTreeNodeBaseVariants,
    treeNodeContainerVariants as monaTreeNodeContainerVariants,
    treeNodeDraggingVariants as monaTreeNodeDraggingVariants,
    treeNodeExpanderVariants as monaTreeNodeExpanderVariants
} from "./tree.mona.styles";
import {
    reinaSubTreeListItemVariants,
    reinaSubTreeListVariants,
    reinaTreeBaseVariants,
    reinaTreeDropHintBaseVariants,
    reinaTreeDropHintIconVariants,
    reinaTreeNodeBaseVariants,
    reinaTreeNodeContainerVariants,
    reinaTreeNodeDraggingVariants,
    reinaTreeNodeExpanderVariants
} from "./tree.reina.styles";
import {
    createSubTreeListItemVariants,
    createSubTreeListVariants,
    createTreeBaseVariants,
    createTreeDropHintBaseVariants,
    createTreeDropHintIconVariants,
    createTreeNodeBaseVariants,
    createTreeNodeContainerVariants,
    createTreeNodeDraggingVariants,
    createTreeNodeExpanderVariants
} from "./tree.style-composition";
import type { TreeStyleOverrides, TreeStyleStrategy, TreeVariantsFunctions } from "./tree.types";

export function createTreeStyleStrategy(overrides: readonly TreeStyleOverrides[] = []): TreeStyleStrategy {
    const mona: TreeVariantsFunctions = {
        subTreeList: createSubTreeListVariants(monaSubTreeListVariants, overrides, "mona"),
        subTreeListItem: createSubTreeListItemVariants(monaSubTreeListItemVariants, overrides, "mona"),
        treeBase: createTreeBaseVariants(monaTreeBaseVariants, overrides, "mona"),
        treeDropHintBase: createTreeDropHintBaseVariants(monaTreeDropHintBaseVariants, overrides, "mona"),
        treeDropHintIcon: createTreeDropHintIconVariants(monaTreeDropHintIconVariants, overrides, "mona"),
        treeNodeBase: createTreeNodeBaseVariants(monaTreeNodeBaseVariants, overrides, "mona"),
        treeNodeContainer: createTreeNodeContainerVariants(monaTreeNodeContainerVariants, overrides, "mona"),
        treeNodeDragging: createTreeNodeDraggingVariants(monaTreeNodeDraggingVariants, overrides, "mona"),
        treeNodeExpander: createTreeNodeExpanderVariants(monaTreeNodeExpanderVariants, overrides, "mona")
    };
    const reina: TreeVariantsFunctions = {
        subTreeList: createSubTreeListVariants(reinaSubTreeListVariants, overrides, "reina"),
        subTreeListItem: createSubTreeListItemVariants(reinaSubTreeListItemVariants, overrides, "reina"),
        treeBase: createTreeBaseVariants(reinaTreeBaseVariants, overrides, "reina"),
        treeDropHintBase: createTreeDropHintBaseVariants(reinaTreeDropHintBaseVariants, overrides, "reina"),
        treeDropHintIcon: createTreeDropHintIconVariants(reinaTreeDropHintIconVariants, overrides, "reina"),
        treeNodeBase: createTreeNodeBaseVariants(reinaTreeNodeBaseVariants, overrides, "reina"),
        treeNodeContainer: createTreeNodeContainerVariants(reinaTreeNodeContainerVariants, overrides, "reina"),
        treeNodeDragging: createTreeNodeDraggingVariants(reinaTreeNodeDraggingVariants, overrides, "reina"),
        treeNodeExpander: createTreeNodeExpanderVariants(reinaTreeNodeExpanderVariants, overrides, "reina")
    };
    return createThemeStrategy<TreeVariantsFunctions>({ mona, reina }, mona);
}
