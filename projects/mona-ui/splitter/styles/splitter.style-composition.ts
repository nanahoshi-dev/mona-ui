import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type {
    SplitterBaseStyleOverrides,
    SplitterBaseVariantProps,
    SplitterBaseVariantsFunction,
    SplitterResizerHandleStyleOverrides,
    SplitterResizerHandleVariantProps,
    SplitterResizerHandleVariantsFunction,
    SplitterResizerStyleOverrides,
    SplitterResizerVariantProps,
    SplitterResizerVariantsFunction,
    SplitterStyleOverrides
} from "./splitter.types";

export function createSplitterBaseVariants(
    base: SplitterBaseVariantsFunction,
    overrides: readonly SplitterStyleOverrides[],
    theme: ThemeStyle
): SplitterBaseVariantsFunction {
    const baseOverrides = activeOverrides(overrides, theme)
        .map(override => override.base)
        .filter((override): override is SplitterBaseStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: SplitterBaseVariantProps = { ...props, orientation: props.orientation ?? "horizontal" };
        const classes: ClassValue[] = [base(props)];

        for (const override of baseOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.orientation, resolvedProps.orientation));

            for (const compoundVariant of override.compoundVariants ?? []) {
                if (matchesCompoundVariant(compoundVariant.when, resolvedProps)) {
                    classes.push(compoundVariant.class);
                }
            }
        }

        return twMerge(cx(...classes));
    };
}

export function createSplitterResizerVariants(
    base: SplitterResizerVariantsFunction,
    overrides: readonly SplitterStyleOverrides[],
    theme: ThemeStyle
): SplitterResizerVariantsFunction {
    const resizerOverrides = activeOverrides(overrides, theme)
        .map(override => override.resizer)
        .filter((override): override is SplitterResizerStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: SplitterResizerVariantProps = {
            ...props,
            orientation: props.orientation ?? "horizontal",
            resizing: props.resizing ?? false
        };
        const classes: ClassValue[] = [base(props)];

        for (const override of resizerOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.orientation, resolvedProps.orientation));
            classes.push(resolveVariantClass(override.resizing, resolvedProps.resizing));

            for (const compoundVariant of override.compoundVariants ?? []) {
                if (matchesCompoundVariant(compoundVariant.when, resolvedProps)) {
                    classes.push(compoundVariant.class);
                }
            }
        }

        return twMerge(cx(...classes));
    };
}

export function createSplitterResizerHandleVariants(
    base: SplitterResizerHandleVariantsFunction,
    overrides: readonly SplitterStyleOverrides[],
    theme: ThemeStyle
): SplitterResizerHandleVariantsFunction {
    const resizerHandleOverrides = activeOverrides(overrides, theme)
        .map(override => override.resizerHandle)
        .filter((override): override is SplitterResizerHandleStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: SplitterResizerHandleVariantProps = {
            ...props,
            orientation: props.orientation ?? "horizontal"
        };
        const classes: ClassValue[] = [base(props)];

        for (const override of resizerHandleOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.orientation, resolvedProps.orientation));

            for (const compoundVariant of override.compoundVariants ?? []) {
                if (matchesCompoundVariant(compoundVariant.when, resolvedProps)) {
                    classes.push(compoundVariant.class);
                }
            }
        }

        return twMerge(cx(...classes));
    };
}

function activeOverrides(
    overrides: readonly SplitterStyleOverrides[],
    theme: ThemeStyle
): readonly SplitterStyleOverrides[] {
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
