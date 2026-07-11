import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type {
    StepperBaseStyleOverrides,
    StepperBaseVariantProps,
    StepperBaseVariantsFunction,
    StepperStepIndicatorStyleOverrides,
    StepperStepIndicatorVariantProps,
    StepperStepIndicatorVariantsFunction,
    StepperStepListItemStyleOverrides,
    StepperStepListItemVariantProps,
    StepperStepListItemVariantsFunction,
    StepperStepListStyleOverrides,
    StepperStepListVariantProps,
    StepperStepListVariantsFunction,
    StepperStyleOverrides,
    StepperTrackLineStyleOverrides,
    StepperTrackLineVariantProps,
    StepperTrackLineVariantsFunction,
    StepperTrackStyleOverrides,
    StepperTrackVariantProps,
    StepperTrackVariantsFunction
} from "./stepper.types";

export function createStepperBaseVariants(
    base: StepperBaseVariantsFunction,
    overrides: readonly StepperStyleOverrides[],
    theme: ThemeStyle
): StepperBaseVariantsFunction {
    const baseOverrides = activeOverrides(overrides, theme)
        .map(override => override.base)
        .filter((override): override is StepperBaseStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: StepperBaseVariantProps = { ...props, orientation: props.orientation ?? "horizontal" };
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

export function createStepperStepListVariants(
    base: StepperStepListVariantsFunction,
    overrides: readonly StepperStyleOverrides[],
    theme: ThemeStyle
): StepperStepListVariantsFunction {
    const stepListOverrides = activeOverrides(overrides, theme)
        .map(override => override.stepList)
        .filter((override): override is StepperStepListStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: StepperStepListVariantProps = {
            ...props,
            orientation: props.orientation ?? "horizontal"
        };
        const classes: ClassValue[] = [base(props)];

        for (const override of stepListOverrides) {
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

export function createStepperStepListItemVariants(
    base: StepperStepListItemVariantsFunction,
    overrides: readonly StepperStyleOverrides[],
    theme: ThemeStyle
): StepperStepListItemVariantsFunction {
    const stepListItemOverrides = activeOverrides(overrides, theme)
        .map(override => override.stepListItem)
        .filter((override): override is StepperStepListItemStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: StepperStepListItemVariantProps = {
            ...props,
            orientation: props.orientation ?? "horizontal"
        };
        const classes: ClassValue[] = [base(props)];

        for (const override of stepListItemOverrides) {
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

export function createStepperStepIndicatorVariants(
    base: StepperStepIndicatorVariantsFunction,
    overrides: readonly StepperStyleOverrides[],
    theme: ThemeStyle
): StepperStepIndicatorVariantsFunction {
    const stepIndicatorOverrides = activeOverrides(overrides, theme)
        .map(override => override.stepIndicator)
        .filter((override): override is StepperStepIndicatorStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: StepperStepIndicatorVariantProps = {
            ...props,
            active: props.active ?? false,
            focused: props.focused ?? false,
            rounded: props.rounded ?? "medium"
        };
        const classes: ClassValue[] = [base(props)];

        for (const override of stepIndicatorOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.active, resolvedProps.active));
            classes.push(resolveVariantClass(override.focused, resolvedProps.focused));
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

export function createStepperTrackVariants(
    base: StepperTrackVariantsFunction,
    overrides: readonly StepperStyleOverrides[],
    theme: ThemeStyle
): StepperTrackVariantsFunction {
    const trackOverrides = activeOverrides(overrides, theme)
        .map(override => override.track)
        .filter((override): override is StepperTrackStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: StepperTrackVariantProps = { ...props, orientation: props.orientation ?? "horizontal" };
        const classes: ClassValue[] = [base(props)];

        for (const override of trackOverrides) {
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

export function createStepperTrackLineVariants(
    base: StepperTrackLineVariantsFunction,
    overrides: readonly StepperStyleOverrides[],
    theme: ThemeStyle
): StepperTrackLineVariantsFunction {
    const trackLineOverrides = activeOverrides(overrides, theme)
        .map(override => override.trackLine)
        .filter((override): override is StepperTrackLineStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: StepperTrackLineVariantProps = {
            ...props,
            orientation: props.orientation ?? "horizontal"
        };
        const classes: ClassValue[] = [base(props)];

        for (const override of trackLineOverrides) {
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
    overrides: readonly StepperStyleOverrides[],
    theme: ThemeStyle
): readonly StepperStyleOverrides[] {
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
