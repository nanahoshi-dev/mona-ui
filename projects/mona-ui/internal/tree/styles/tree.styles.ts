import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import {
    subTreeListItemVariants as annaSubTreeListItemVariants,
    subTreeListVariants as annaSubTreeListVariants,
    treeBaseVariants as annaTreeBaseVariants,
    treeDropHintBaseVariants as annaTreeDropHintBaseVariants,
    treeDropHintIconVariants as annaTreeDropHintIconVariants,
    treeNodeBaseVariants as annaTreeNodeBaseVariants,
    treeNodeContainerVariants as annaTreeNodeContainerVariants,
    treeNodeDraggingVariants as annaTreeNodeDraggingVariants,
    treeNodeExpanderVariants as annaTreeNodeExpanderVariants
} from "./tree.anna.styles";
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

export const subTreeListThemeVariants = createThemeStrategy({
    anna: annaSubTreeListVariants,
    mona: monaSubTreeListVariants
});

export const subTreeListItemThemeVariants = createThemeStrategy({
    anna: annaSubTreeListItemVariants,
    mona: monaSubTreeListItemVariants
});

export const treeBaseThemeVariants = createThemeStrategy({
    anna: annaTreeBaseVariants,
    mona: monaTreeBaseVariants
});

export const treeDropHintBaseThemeVariants = createThemeStrategy({
    anna: annaTreeDropHintBaseVariants,
    mona: monaTreeDropHintBaseVariants
});

export const treeDropHintIconThemeVariants = createThemeStrategy({
    anna: annaTreeDropHintIconVariants,
    mona: monaTreeDropHintIconVariants
});

export const treeNodeBaseThemeVariants = createThemeStrategy({
    anna: annaTreeNodeBaseVariants,
    mona: monaTreeNodeBaseVariants
});

export const treeNodeContainerThemeVariants = createThemeStrategy({
    anna: annaTreeNodeContainerVariants,
    mona: monaTreeNodeContainerVariants
});

export const treeNodeDraggingThemeVariants = createThemeStrategy({
    anna: annaTreeNodeDraggingVariants,
    mona: monaTreeNodeDraggingVariants
});

export const treeNodeExpanderThemeVariants = createThemeStrategy({
    anna: annaTreeNodeExpanderVariants,
    mona: monaTreeNodeExpanderVariants
});
