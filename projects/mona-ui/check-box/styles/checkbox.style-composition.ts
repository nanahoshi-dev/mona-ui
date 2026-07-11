import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type {
    CheckboxContainerLabelStyleOverrides,
    CheckboxContainerLabelVariantProps,
    CheckboxContainerLabelVariantsFunction,
    CheckboxDirectiveStyleOverrides,
    CheckboxDirectiveVariantProps,
    CheckboxDirectiveVariantsFunction,
    CheckboxInputStyleOverrides,
    CheckboxInputVariantsFunction,
    CheckboxStyleOverrides,
    CheckmarkStyleOverrides,
    CheckmarkVariantProps,
    CheckmarkVariantsFunction
} from "./checkbox.types";

export function createCheckboxInputVariants(
    base: CheckboxInputVariantsFunction,
    overrides: readonly CheckboxStyleOverrides[],
    theme: ThemeStyle
): CheckboxInputVariantsFunction {
    const inputOverrides = activeOverrides(overrides, theme)
        .map(override => override.input)
        .filter((override): override is CheckboxInputStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of inputOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

export function createCheckmarkVariants(
    base: CheckmarkVariantsFunction,
    overrides: readonly CheckboxStyleOverrides[],
    theme: ThemeStyle
): CheckmarkVariantsFunction {
    const checkmarkOverrides = activeOverrides(overrides, theme)
        .map(override => override.checkmark)
        .filter((override): override is CheckmarkStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: CheckmarkVariantProps = { ...props, rounded: props.rounded ?? "medium" };
        const classes: ClassValue[] = [base(props)];

        for (const override of checkmarkOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.rounded, resolvedProps.rounded));

            for (const compoundVariant of override.compoundVariants ?? []) {
                if (matchesCompoundVariant(compoundVariant.when, resolvedProps)) {
                    classes.push(compoundVariant.class);
                }
            }
        }

        return twMerge(cx(...classes));
    };
}

export function createCheckboxContainerLabelVariants(
    base: CheckboxContainerLabelVariantsFunction,
    overrides: readonly CheckboxStyleOverrides[],
    theme: ThemeStyle
): CheckboxContainerLabelVariantsFunction {
    const containerLabelOverrides = activeOverrides(overrides, theme)
        .map(override => override.containerLabel)
        .filter((override): override is CheckboxContainerLabelStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: CheckboxContainerLabelVariantProps = { ...props, labelSize: props.labelSize ?? "medium" };
        const classes: ClassValue[] = [base(props)];

        for (const override of containerLabelOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.labelSize, resolvedProps.labelSize));

            for (const compoundVariant of override.compoundVariants ?? []) {
                if (matchesCompoundVariant(compoundVariant.when, resolvedProps)) {
                    classes.push(compoundVariant.class);
                }
            }
        }

        return twMerge(cx(...classes));
    };
}

export function createCheckboxDirectiveVariants(
    base: CheckboxDirectiveVariantsFunction,
    overrides: readonly CheckboxStyleOverrides[],
    theme: ThemeStyle
): CheckboxDirectiveVariantsFunction {
    const directiveOverrides = activeOverrides(overrides, theme)
        .map(override => override.directive)
        .filter((override): override is CheckboxDirectiveStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: CheckboxDirectiveVariantProps = { ...props, rounded: props.rounded ?? "medium" };
        const classes: ClassValue[] = [base(props)];

        for (const override of directiveOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.rounded, resolvedProps.rounded));

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
    overrides: readonly CheckboxStyleOverrides[],
    theme: ThemeStyle
): readonly CheckboxStyleOverrides[] {
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
