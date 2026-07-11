import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import {
    inputVariants as monaInputVariants,
    textBoxVariants as monaTextBoxVariants
} from "./textbox.mona.styles";
import { reinaInputVariants, reinaTextBoxVariants } from "./textbox.reina.styles";
import type {
    TextBoxBaseVariantProps,
    TextBoxInputVariantProps,
    TextBoxStyleOverrides,
    TextBoxVariantsBundle
} from "./textbox.types";

function resolveVariantClass(
    classes: Partial<Record<string, ClassValue>> | undefined,
    value: unknown
): ClassValue | undefined {
    if (classes === undefined || value === null || value === undefined) {
        return undefined;
    }
    return classes[String(value)];
}

function activeOverrides(overrides: readonly TextBoxStyleOverrides[], theme: ThemeStyle): readonly TextBoxStyleOverrides[] {
    return overrides.filter(override => override.theme === undefined || override.theme === theme);
}

export function createTextBoxVariants(
    baseVariants: typeof monaTextBoxVariants,
    inputVariants: typeof monaInputVariants,
    overrides: readonly TextBoxStyleOverrides[],
    theme: ThemeStyle
): TextBoxVariantsBundle {
    const relevant = activeOverrides(overrides, theme);

    return {
        base: (props: TextBoxBaseVariantProps = {}) => {
            const classes: ClassValue[] = [baseVariants(props)];
            for (const override of relevant) {
                classes.push(override.base?.root);
                classes.push(resolveVariantClass(override.base?.rounded, props.rounded));
                classes.push(resolveVariantClass(override.base?.size, props.size));
            }
            return twMerge(cx(...classes));
        },
        input: (props: TextBoxInputVariantProps = {}) => {
            const classes: ClassValue[] = [inputVariants(props)];
            for (const override of relevant) {
                classes.push(override.input?.root);
                classes.push(resolveVariantClass(override.input?.rounded, props.rounded));
                classes.push(resolveVariantClass(override.input?.size, props.size));
            }
            return twMerge(cx(...classes));
        }
    };
}

export function createMonaTextBoxVariants(
    overrides: readonly TextBoxStyleOverrides[],
    theme: ThemeStyle
): TextBoxVariantsBundle {
    return createTextBoxVariants(monaTextBoxVariants, monaInputVariants, overrides, theme);
}

export function createReinaTextBoxVariants(
    overrides: readonly TextBoxStyleOverrides[],
    theme: ThemeStyle
): TextBoxVariantsBundle {
    return createTextBoxVariants(reinaTextBoxVariants, reinaInputVariants, overrides, theme);
}
