import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import {
    numericTextboxButtonVariants as monaNumericTextboxButtonVariants,
    numericTextboxInputVariants as monaNumericTextboxInputVariants,
    numericTextboxVariants as monaNumericTextboxVariants
} from "./numeric-textbox.mona.styles";
import {
    reinaNumericTextboxButtonVariants,
    reinaNumericTextboxInputVariants,
    reinaNumericTextboxVariants
} from "./numeric-textbox.reina.styles";
import type {
    NumericTextboxBaseVariantProps,
    NumericTextboxButtonVariantProps,
    NumericTextboxInputVariantProps,
    NumericTextboxStyleOverrides,
    NumericTextboxVariantsBundle
} from "./numeric-textbox.types";

function resolveVariantClass(
    classes: Partial<Record<string, ClassValue>> | undefined,
    value: unknown
): ClassValue | undefined {
    if (classes === undefined || value === null || value === undefined) {
        return undefined;
    }
    return classes[String(value)];
}

function activeOverrides(
    overrides: readonly NumericTextboxStyleOverrides[],
    theme: ThemeStyle
): readonly NumericTextboxStyleOverrides[] {
    return overrides.filter(override => override.theme === undefined || override.theme === theme);
}

export function createNumericTextboxVariants(
    baseVariants: typeof monaNumericTextboxVariants,
    inputVariants: typeof monaNumericTextboxInputVariants,
    buttonVariants: typeof monaNumericTextboxButtonVariants,
    overrides: readonly NumericTextboxStyleOverrides[],
    theme: ThemeStyle
): NumericTextboxVariantsBundle {
    const relevant = activeOverrides(overrides, theme);

    return {
        base: (props: NumericTextboxBaseVariantProps = {}) => {
            const classes: ClassValue[] = [baseVariants(props)];
            for (const override of relevant) {
                classes.push(override.base?.root);
                classes.push(resolveVariantClass(override.base?.rounded, props.rounded));
                classes.push(resolveVariantClass(override.base?.size, props.size));
            }
            return twMerge(cx(...classes));
        },
        input: (props: NumericTextboxInputVariantProps = {}) => {
            const classes: ClassValue[] = [inputVariants(props)];
            for (const override of relevant) {
                classes.push(override.input?.root);
                classes.push(resolveVariantClass(override.input?.leftRounded, props.leftRounded));
                classes.push(resolveVariantClass(override.input?.rightRounded, props.rightRounded));
            }
            return twMerge(cx(...classes));
        },
        button: (props: NumericTextboxButtonVariantProps = {}) => {
            const classes: ClassValue[] = [buttonVariants(props)];
            for (const override of relevant) {
                classes.push(override.button?.root);
                classes.push(resolveVariantClass(override.button?.size, props.size));
            }
            return twMerge(cx(...classes));
        }
    };
}

export function createMonaNumericTextboxVariants(
    overrides: readonly NumericTextboxStyleOverrides[],
    theme: ThemeStyle
): NumericTextboxVariantsBundle {
    return createNumericTextboxVariants(
        monaNumericTextboxVariants,
        monaNumericTextboxInputVariants,
        monaNumericTextboxButtonVariants,
        overrides,
        theme
    );
}

export function createReinaNumericTextboxVariants(
    overrides: readonly NumericTextboxStyleOverrides[],
    theme: ThemeStyle
): NumericTextboxVariantsBundle {
    return createNumericTextboxVariants(
        reinaNumericTextboxVariants,
        reinaNumericTextboxInputVariants,
        reinaNumericTextboxButtonVariants,
        overrides,
        theme
    );
}
