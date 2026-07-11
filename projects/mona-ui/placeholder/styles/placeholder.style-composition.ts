import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type {
    PlaceholderBaseStyleOverrides,
    PlaceholderBaseVariantsFunction,
    PlaceholderStyleOverrides,
    PlaceholderTextStyleOverrides,
    PlaceholderTextVariantsFunction
} from "./placeholder.types";

export function createPlaceholderBaseVariants(
    base: PlaceholderBaseVariantsFunction,
    overrides: readonly PlaceholderStyleOverrides[],
    theme: ThemeStyle
): PlaceholderBaseVariantsFunction {
    const baseOverrides = activeOverrides(overrides, theme)
        .map(override => override.base)
        .filter((override): override is PlaceholderBaseStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of baseOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

export function createPlaceholderTextVariants(
    base: PlaceholderTextVariantsFunction,
    overrides: readonly PlaceholderStyleOverrides[],
    theme: ThemeStyle
): PlaceholderTextVariantsFunction {
    const textOverrides = activeOverrides(overrides, theme)
        .map(override => override.text)
        .filter((override): override is PlaceholderTextStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of textOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

function activeOverrides(
    overrides: readonly PlaceholderStyleOverrides[],
    theme: ThemeStyle
): readonly PlaceholderStyleOverrides[] {
    return overrides.filter(override => override.theme === undefined || override.theme === theme);
}
