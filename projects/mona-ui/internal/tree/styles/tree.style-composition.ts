import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type {
    SubTreeListItemStyleOverrides,
    SubTreeListItemVariantsFunction,
    SubTreeListStyleOverrides,
    SubTreeListVariantsFunction,
    TreeBaseStyleOverrides,
    TreeBaseVariantsFunction,
    TreeDropHintBaseStyleOverrides,
    TreeDropHintBaseVariantsFunction,
    TreeDropHintIconStyleOverrides,
    TreeDropHintIconVariantsFunction,
    TreeNodeBaseStyleOverrides,
    TreeNodeBaseVariantProps,
    TreeNodeBaseVariantsFunction,
    TreeNodeContainerStyleOverrides,
    TreeNodeContainerVariantsFunction,
    TreeNodeDraggingStyleOverrides,
    TreeNodeDraggingVariantsFunction,
    TreeNodeExpanderStyleOverrides,
    TreeNodeExpanderVariantsFunction,
    TreeStyleOverrides
} from "./tree.types";

export function createSubTreeListVariants(
    base: SubTreeListVariantsFunction,
    overrides: readonly TreeStyleOverrides[],
    theme: ThemeStyle
): SubTreeListVariantsFunction {
    return createStaticVariants(base, overrides, theme, override => override.subTreeList);
}

export function createSubTreeListItemVariants(
    base: SubTreeListItemVariantsFunction,
    overrides: readonly TreeStyleOverrides[],
    theme: ThemeStyle
): SubTreeListItemVariantsFunction {
    return createStaticVariants(base, overrides, theme, override => override.subTreeListItem);
}

export function createTreeBaseVariants(
    base: TreeBaseVariantsFunction,
    overrides: readonly TreeStyleOverrides[],
    theme: ThemeStyle
): TreeBaseVariantsFunction {
    return createStaticVariants(base, overrides, theme, override => override.treeBase);
}

export function createTreeDropHintBaseVariants(
    base: TreeDropHintBaseVariantsFunction,
    overrides: readonly TreeStyleOverrides[],
    theme: ThemeStyle
): TreeDropHintBaseVariantsFunction {
    return createStaticVariants(base, overrides, theme, override => override.treeDropHintBase);
}

export function createTreeDropHintIconVariants(
    base: TreeDropHintIconVariantsFunction,
    overrides: readonly TreeStyleOverrides[],
    theme: ThemeStyle
): TreeDropHintIconVariantsFunction {
    return createStaticVariants(base, overrides, theme, override => override.treeDropHintIcon);
}

export function createTreeNodeBaseVariants(
    base: TreeNodeBaseVariantsFunction,
    overrides: readonly TreeStyleOverrides[],
    theme: ThemeStyle
): TreeNodeBaseVariantsFunction {
    const nodeBaseOverrides = activeOverrides(overrides, theme)
        .map(override => override.treeNodeBase)
        .filter((override): override is TreeNodeBaseStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: TreeNodeBaseVariantProps = {
            disabled: false,
            highlighted: false,
            selected: false,
            ...props
        };
        const classes: ClassValue[] = [base(props)];

        for (const override of nodeBaseOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.disabled, resolvedProps.disabled));
            classes.push(resolveVariantClass(override.highlighted, resolvedProps.highlighted));
            classes.push(resolveVariantClass(override.selected, resolvedProps.selected));

            for (const compoundVariant of override.compoundVariants ?? []) {
                if (matchesCompoundVariant(compoundVariant.when, resolvedProps)) {
                    classes.push(compoundVariant.class);
                }
            }
        }

        return twMerge(cx(...classes));
    };
}

export function createTreeNodeContainerVariants(
    base: TreeNodeContainerVariantsFunction,
    overrides: readonly TreeStyleOverrides[],
    theme: ThemeStyle
): TreeNodeContainerVariantsFunction {
    return createStaticVariants(base, overrides, theme, override => override.treeNodeContainer);
}

export function createTreeNodeDraggingVariants(
    base: TreeNodeDraggingVariantsFunction,
    overrides: readonly TreeStyleOverrides[],
    theme: ThemeStyle
): TreeNodeDraggingVariantsFunction {
    return createStaticVariants(base, overrides, theme, override => override.treeNodeDragging);
}

export function createTreeNodeExpanderVariants(
    base: TreeNodeExpanderVariantsFunction,
    overrides: readonly TreeStyleOverrides[],
    theme: ThemeStyle
): TreeNodeExpanderVariantsFunction {
    return createStaticVariants(base, overrides, theme, override => override.treeNodeExpander);
}

function createStaticVariants<TStyleOverrides extends { readonly base?: ClassValue }>(
    base: () => string,
    overrides: readonly TreeStyleOverrides[],
    theme: ThemeStyle,
    select: (override: TreeStyleOverrides) => TStyleOverrides | undefined
): () => string {
    const staticOverrides = activeOverrides(overrides, theme)
        .map(select)
        .filter((override): override is TStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of staticOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

function activeOverrides(overrides: readonly TreeStyleOverrides[], theme: ThemeStyle): readonly TreeStyleOverrides[] {
    return overrides.filter(override => override.theme === undefined || override.theme === theme);
}

function resolveVariantClass(
    classes: Partial<Record<string, ClassValue>> | undefined,
    value: unknown
): ClassValue | undefined {
    if (classes === undefined || value === null || value === undefined) {
        return undefined;
    }

    return classes[String(value)];
}

function matchesCompoundVariant<T extends Record<string, unknown>>(expected: Partial<T>, actual: T): boolean {
    return Object.entries(expected).every(([key, expectedValue]) => actual[key as keyof T] === expectedValue);
}
