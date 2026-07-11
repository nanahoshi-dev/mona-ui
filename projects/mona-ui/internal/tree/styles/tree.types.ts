import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type {
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

export type SubTreeListVariantsFunction = (props?: SubTreeListVariantProps) => string;
export type SubTreeListVariantProps = VariantProps<typeof monaSubTreeListVariants>;

export type SubTreeListItemVariantsFunction = (props?: SubTreeListItemVariantProps) => string;
export type SubTreeListItemVariantProps = VariantProps<typeof monaSubTreeListItemVariants>;

export type TreeBaseVariantsFunction = (props?: TreeBaseVariantProps) => string;
export type TreeBaseVariantProps = VariantProps<typeof monaTreeBaseVariants>;

export type TreeDropHintBaseVariantsFunction = (props?: TreeDropHintBaseVariantProps) => string;
export type TreeDropHintBaseVariantProps = VariantProps<typeof monaTreeDropHintBaseVariants>;

export type TreeDropHintIconVariantsFunction = (props?: TreeDropHintIconVariantProps) => string;
export type TreeDropHintIconVariantProps = VariantProps<typeof monaTreeDropHintIconVariants>;

export type TreeNodeBaseVariantsFunction = (props?: TreeNodeBaseVariantProps) => string;
export type TreeNodeBaseVariantProps = VariantProps<typeof monaTreeNodeBaseVariants>;

export type TreeNodeContainerVariantsFunction = (props?: TreeNodeContainerVariantProps) => string;
export type TreeNodeContainerVariantProps = VariantProps<typeof monaTreeNodeContainerVariants>;

export type TreeNodeDraggingVariantsFunction = (props?: TreeNodeDraggingVariantProps) => string;
export type TreeNodeDraggingVariantProps = VariantProps<typeof monaTreeNodeDraggingVariants>;

export type TreeNodeExpanderVariantsFunction = (props?: TreeNodeExpanderVariantProps) => string;
export type TreeNodeExpanderVariantProps = VariantProps<typeof monaTreeNodeExpanderVariants>;

export interface TreeVariantsFunctions {
    readonly subTreeList: SubTreeListVariantsFunction;
    readonly subTreeListItem: SubTreeListItemVariantsFunction;
    readonly treeBase: TreeBaseVariantsFunction;
    readonly treeDropHintBase: TreeDropHintBaseVariantsFunction;
    readonly treeDropHintIcon: TreeDropHintIconVariantsFunction;
    readonly treeNodeBase: TreeNodeBaseVariantsFunction;
    readonly treeNodeContainer: TreeNodeContainerVariantsFunction;
    readonly treeNodeDragging: TreeNodeDraggingVariantsFunction;
    readonly treeNodeExpander: TreeNodeExpanderVariantsFunction;
}

export type TreeStyleStrategy = ThemeStrategy<TreeVariantsFunctions>;

export interface SubTreeListStyleOverrides {
    readonly base?: ClassValue;
}

export interface SubTreeListItemStyleOverrides {
    readonly base?: ClassValue;
}

export interface TreeBaseStyleOverrides {
    readonly base?: ClassValue;
}

export interface TreeDropHintBaseStyleOverrides {
    readonly base?: ClassValue;
}

export interface TreeDropHintIconStyleOverrides {
    readonly base?: ClassValue;
}

export interface TreeNodeBaseCompoundStyleOverride {
    readonly when: Partial<TreeNodeBaseVariantProps>;
    readonly class: ClassValue;
}

export interface TreeNodeBaseStyleOverrides {
    readonly base?: ClassValue;
    readonly disabled?: Partial<Record<`${NonNullable<TreeNodeBaseVariantProps["disabled"]>}`, ClassValue>>;
    readonly highlighted?: Partial<Record<`${NonNullable<TreeNodeBaseVariantProps["highlighted"]>}`, ClassValue>>;
    readonly selected?: Partial<Record<`${NonNullable<TreeNodeBaseVariantProps["selected"]>}`, ClassValue>>;
    readonly compoundVariants?: readonly TreeNodeBaseCompoundStyleOverride[];
}

export interface TreeNodeContainerStyleOverrides {
    readonly base?: ClassValue;
}

export interface TreeNodeDraggingStyleOverrides {
    readonly base?: ClassValue;
}

export interface TreeNodeExpanderStyleOverrides {
    readonly base?: ClassValue;
}

export interface TreeStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly subTreeList?: SubTreeListStyleOverrides;
    readonly subTreeListItem?: SubTreeListItemStyleOverrides;
    readonly treeBase?: TreeBaseStyleOverrides;
    readonly treeDropHintBase?: TreeDropHintBaseStyleOverrides;
    readonly treeDropHintIcon?: TreeDropHintIconStyleOverrides;
    readonly treeNodeBase?: TreeNodeBaseStyleOverrides;
    readonly treeNodeContainer?: TreeNodeContainerStyleOverrides;
    readonly treeNodeDragging?: TreeNodeDraggingStyleOverrides;
    readonly treeNodeExpander?: TreeNodeExpanderStyleOverrides;
}

export type TreeStylesProviderConfig = TreeStyleOverrides | { readonly strategy: TreeStyleStrategy };
