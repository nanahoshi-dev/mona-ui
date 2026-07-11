import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type {
    SliderBaseStyleOverrides,
    SliderBaseVariantsFunction,
    SliderHandleStyleOverrides,
    SliderHandleVariantProps,
    SliderHandleVariantsFunction,
    SliderSelectionStyleOverrides,
    SliderSelectionVariantsFunction,
    SliderStyleOverrides,
    SliderTickLabelListStyleOverrides,
    SliderTickLabelListVariantsFunction,
    SliderTickLabelStyleOverrides,
    SliderTickLabelVariantsFunction,
    SliderTickListStyleOverrides,
    SliderTickListVariantsFunction,
    SliderTickStyleOverrides,
    SliderTickVariantsFunction,
    SliderTrackStyleOverrides,
    SliderTrackVariantsFunction
} from "./slider.types";

export function createSliderBaseVariants(
    base: SliderBaseVariantsFunction,
    overrides: readonly SliderStyleOverrides[],
    theme: ThemeStyle
): SliderBaseVariantsFunction {
    const baseOverrides = activeOverrides(overrides, theme)
        .map(override => override.base)
        .filter((override): override is SliderBaseStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of baseOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

export function createSliderTrackVariants(
    base: SliderTrackVariantsFunction,
    overrides: readonly SliderStyleOverrides[],
    theme: ThemeStyle
): SliderTrackVariantsFunction {
    const trackOverrides = activeOverrides(overrides, theme)
        .map(override => override.track)
        .filter((override): override is SliderTrackStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of trackOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

export function createSliderSelectionVariants(
    base: SliderSelectionVariantsFunction,
    overrides: readonly SliderStyleOverrides[],
    theme: ThemeStyle
): SliderSelectionVariantsFunction {
    const selectionOverrides = activeOverrides(overrides, theme)
        .map(override => override.selection)
        .filter((override): override is SliderSelectionStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of selectionOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

export function createSliderTickListVariants(
    base: SliderTickListVariantsFunction,
    overrides: readonly SliderStyleOverrides[],
    theme: ThemeStyle
): SliderTickListVariantsFunction {
    const tickListOverrides = activeOverrides(overrides, theme)
        .map(override => override.tickList)
        .filter((override): override is SliderTickListStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of tickListOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

export function createSliderTickVariants(
    base: SliderTickVariantsFunction,
    overrides: readonly SliderStyleOverrides[],
    theme: ThemeStyle
): SliderTickVariantsFunction {
    const tickOverrides = activeOverrides(overrides, theme)
        .map(override => override.tick)
        .filter((override): override is SliderTickStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of tickOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

export function createSliderTickLabelListVariants(
    base: SliderTickLabelListVariantsFunction,
    overrides: readonly SliderStyleOverrides[],
    theme: ThemeStyle
): SliderTickLabelListVariantsFunction {
    const tickLabelListOverrides = activeOverrides(overrides, theme)
        .map(override => override.tickLabelList)
        .filter((override): override is SliderTickLabelListStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of tickLabelListOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

export function createSliderTickLabelVariants(
    base: SliderTickLabelVariantsFunction,
    overrides: readonly SliderStyleOverrides[],
    theme: ThemeStyle
): SliderTickLabelVariantsFunction {
    const tickLabelOverrides = activeOverrides(overrides, theme)
        .map(override => override.tickLabel)
        .filter((override): override is SliderTickLabelStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of tickLabelOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

export function createSliderHandleVariants(
    base: SliderHandleVariantsFunction,
    overrides: readonly SliderStyleOverrides[],
    theme: ThemeStyle
): SliderHandleVariantsFunction {
    const handleOverrides = activeOverrides(overrides, theme)
        .map(override => override.handle)
        .filter((override): override is SliderHandleStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: SliderHandleVariantProps = { ...props, rounded: props.rounded ?? "full" };
        const classes: ClassValue[] = [base(props)];

        for (const override of handleOverrides) {
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
    overrides: readonly SliderStyleOverrides[],
    theme: ThemeStyle
): readonly SliderStyleOverrides[] {
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
