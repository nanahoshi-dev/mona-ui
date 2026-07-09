import { ThemeStyle } from "@nanahoshi/mona-ui/theme";
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

export const subTreeListThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaSubTreeListVariants;
        default:
            return monaSubTreeListVariants;
    }
};

export const subTreeListItemThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaSubTreeListItemVariants;
        default:
            return monaSubTreeListItemVariants;
    }
};

export const treeBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaTreeBaseVariants;
        default:
            return monaTreeBaseVariants;
    }
};

export const treeDropHintBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaTreeDropHintBaseVariants;
        default:
            return monaTreeDropHintBaseVariants;
    }
};

export const treeDropHintIconThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaTreeDropHintIconVariants;
        default:
            return monaTreeDropHintIconVariants;
    }
};

export const treeNodeBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaTreeNodeBaseVariants;
        default:
            return monaTreeNodeBaseVariants;
    }
};

export const treeNodeContainerThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaTreeNodeContainerVariants;
        default:
            return monaTreeNodeContainerVariants;
    }
};

export const treeNodeDraggingThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaTreeNodeDraggingVariants;
        default:
            return monaTreeNodeDraggingVariants;
    }
};

export const treeNodeExpanderThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaTreeNodeExpanderVariants;
        default:
            return monaTreeNodeExpanderVariants;
    }
};
