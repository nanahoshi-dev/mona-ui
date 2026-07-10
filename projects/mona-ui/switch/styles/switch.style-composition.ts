import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type {
    SwitchHandleStyleOverrides,
    SwitchHandleVariantProps,
    SwitchHandleVariantsFunction,
    SwitchLabelStyleOverrides,
    SwitchLabelVariantsFunction,
    SwitchStyleOverrides,
    SwitchTrackStyleOverrides,
    SwitchTrackVariantProps,
    SwitchTrackVariantsFunction
} from "./switch.types";

export function createSwitchTrackVariants(
    base: SwitchTrackVariantsFunction,
    overrides: readonly SwitchStyleOverrides[],
    theme: ThemeStyle
): SwitchTrackVariantsFunction {
    const trackOverrides = activeOverrides(overrides, theme)
        .map(override => override.track)
        .filter((override): override is SwitchTrackStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps = {
            ...props,
            rounded: props.rounded ?? "full",
            size: props.size ?? "medium"
        };
        const classes: ClassValue[] = [base(props)];

        for (const override of trackOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.rounded, resolvedProps.rounded));
            classes.push(resolveVariantClass(override.size, resolvedProps.size));

            for (const compoundVariant of override.compoundVariants ?? []) {
                if (matchesCompoundVariant(compoundVariant.when, resolvedProps)) {
                    classes.push(compoundVariant.class);
                }
            }
        }

        return twMerge(cx(...classes));
    };
}

export function createSwitchHandleVariants(
    base: SwitchHandleVariantsFunction,
    overrides: readonly SwitchStyleOverrides[],
    theme: ThemeStyle
): SwitchHandleVariantsFunction {
    const handleOverrides = activeOverrides(overrides, theme)
        .map(override => override.handle)
        .filter((override): override is SwitchHandleStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps = {
            ...props,
            rounded: props.rounded ?? "full",
            size: props.size ?? "medium"
        };
        const classes: ClassValue[] = [base(props)];

        for (const override of handleOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.rounded, resolvedProps.rounded));
            classes.push(resolveVariantClass(override.size, resolvedProps.size));

            for (const compoundVariant of override.compoundVariants ?? []) {
                if (matchesCompoundVariant(compoundVariant.when, resolvedProps)) {
                    classes.push(compoundVariant.class);
                }
            }
        }

        return twMerge(cx(...classes));
    };
}

export function createSwitchLabelVariants(
    base: SwitchLabelVariantsFunction,
    overrides: readonly SwitchStyleOverrides[],
    theme: ThemeStyle
): SwitchLabelVariantsFunction {
    const labelOverrides = activeOverrides(overrides, theme)
        .map(override => override.label)
        .filter((override): override is SwitchLabelStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of labelOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

function activeOverrides(
    overrides: readonly SwitchStyleOverrides[],
    theme: ThemeStyle
): readonly SwitchStyleOverrides[] {
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
