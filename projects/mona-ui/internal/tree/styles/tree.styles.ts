import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
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

const subTreeListThemeVariantsStrategy = createThemeStrategy(
    { mona: monaSubTreeListVariants },
    monaSubTreeListVariants
);

export const subTreeListThemeVariants = (theme: ThemeStyle) => subTreeListThemeVariantsStrategy.resolve(theme);

const subTreeListItemThemeVariantsStrategy = createThemeStrategy(
    { mona: monaSubTreeListItemVariants },
    monaSubTreeListItemVariants
);

export const subTreeListItemThemeVariants = (theme: ThemeStyle) => subTreeListItemThemeVariantsStrategy.resolve(theme);

const treeBaseThemeVariantsStrategy = createThemeStrategy({ mona: monaTreeBaseVariants }, monaTreeBaseVariants);

export const treeBaseThemeVariants = (theme: ThemeStyle) => treeBaseThemeVariantsStrategy.resolve(theme);

const treeDropHintBaseThemeVariantsStrategy = createThemeStrategy(
    { mona: monaTreeDropHintBaseVariants },
    monaTreeDropHintBaseVariants
);

export const treeDropHintBaseThemeVariants = (theme: ThemeStyle) =>
    treeDropHintBaseThemeVariantsStrategy.resolve(theme);

const treeDropHintIconThemeVariantsStrategy = createThemeStrategy(
    { mona: monaTreeDropHintIconVariants },
    monaTreeDropHintIconVariants
);

export const treeDropHintIconThemeVariants = (theme: ThemeStyle) =>
    treeDropHintIconThemeVariantsStrategy.resolve(theme);

const treeNodeBaseThemeVariantsStrategy = createThemeStrategy(
    { mona: monaTreeNodeBaseVariants },
    monaTreeNodeBaseVariants
);

export const treeNodeBaseThemeVariants = (theme: ThemeStyle) => treeNodeBaseThemeVariantsStrategy.resolve(theme);

const treeNodeContainerThemeVariantsStrategy = createThemeStrategy(
    { mona: monaTreeNodeContainerVariants },
    monaTreeNodeContainerVariants
);

export const treeNodeContainerThemeVariants = (theme: ThemeStyle) =>
    treeNodeContainerThemeVariantsStrategy.resolve(theme);

const treeNodeDraggingThemeVariantsStrategy = createThemeStrategy(
    { mona: monaTreeNodeDraggingVariants },
    monaTreeNodeDraggingVariants
);

export const treeNodeDraggingThemeVariants = (theme: ThemeStyle) =>
    treeNodeDraggingThemeVariantsStrategy.resolve(theme);

const treeNodeExpanderThemeVariantsStrategy = createThemeStrategy(
    { mona: monaTreeNodeExpanderVariants },
    monaTreeNodeExpanderVariants
);

export const treeNodeExpanderThemeVariants = (theme: ThemeStyle) =>
    treeNodeExpanderThemeVariantsStrategy.resolve(theme);
