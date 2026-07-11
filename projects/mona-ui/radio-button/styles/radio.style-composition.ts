import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type {
    RadioButtonCircleStyleOverrides,
    RadioButtonCircleVariantProps,
    RadioButtonCircleVariantsFunction,
    RadioButtonContainerLabelStyleOverrides,
    RadioButtonContainerLabelVariantProps,
    RadioButtonContainerLabelVariantsFunction,
    RadioButtonDirectiveProps,
    RadioButtonDirectiveStyleOverrides,
    RadioButtonDirectiveVariantsFunction,
    RadioButtonHostStyleOverrides,
    RadioButtonIndicatorStyleOverrides,
    RadioButtonIndicatorVariantProps,
    RadioButtonIndicatorVariantsFunction,
    RadioButtonStyleOverrides,
    RadioButtonVariantsFunction
} from "./radio.types";

export function createRadioButtonHostVariants(
    base: RadioButtonVariantsFunction,
    overrides: readonly RadioButtonStyleOverrides[],
    theme: ThemeStyle
): RadioButtonVariantsFunction {
    const hostOverrides = activeOverrides(overrides, theme)
        .map(override => override.host)
        .filter((override): override is RadioButtonHostStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of hostOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

export function createRadioButtonCircleVariants(
    base: RadioButtonCircleVariantsFunction,
    overrides: readonly RadioButtonStyleOverrides[],
    theme: ThemeStyle
): RadioButtonCircleVariantsFunction {
    const circleOverrides = activeOverrides(overrides, theme)
        .map(override => override.circle)
        .filter((override): override is RadioButtonCircleStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: RadioButtonCircleVariantProps = { ...props, rounded: props.rounded ?? "medium" };
        const classes: ClassValue[] = [base(props)];

        for (const override of circleOverrides) {
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

export function createRadioButtonIndicatorVariants(
    base: RadioButtonIndicatorVariantsFunction,
    overrides: readonly RadioButtonStyleOverrides[],
    theme: ThemeStyle
): RadioButtonIndicatorVariantsFunction {
    const indicatorOverrides = activeOverrides(overrides, theme)
        .map(override => override.indicator)
        .filter((override): override is RadioButtonIndicatorStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: RadioButtonIndicatorVariantProps = { ...props, rounded: props.rounded ?? "medium" };
        const classes: ClassValue[] = [base(props)];

        for (const override of indicatorOverrides) {
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

export function createRadioButtonContainerLabelVariants(
    base: RadioButtonContainerLabelVariantsFunction,
    overrides: readonly RadioButtonStyleOverrides[],
    theme: ThemeStyle
): RadioButtonContainerLabelVariantsFunction {
    const containerLabelOverrides = activeOverrides(overrides, theme)
        .map(override => override.containerLabel)
        .filter((override): override is RadioButtonContainerLabelStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: RadioButtonContainerLabelVariantProps = {
            ...props,
            labelSize: props.labelSize ?? "medium"
        };
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

export function createRadioButtonDirectiveVariants(
    base: RadioButtonDirectiveVariantsFunction,
    overrides: readonly RadioButtonStyleOverrides[],
    theme: ThemeStyle
): RadioButtonDirectiveVariantsFunction {
    const directiveOverrides = activeOverrides(overrides, theme)
        .map(override => override.directive)
        .filter((override): override is RadioButtonDirectiveStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: RadioButtonDirectiveProps = { ...props, rounded: props.rounded ?? "medium" };
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
    overrides: readonly RadioButtonStyleOverrides[],
    theme: ThemeStyle
): readonly RadioButtonStyleOverrides[] {
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
