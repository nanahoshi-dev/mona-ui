import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type {
    WindowBaseStyleOverrides,
    WindowBaseVariantProps,
    WindowBaseVariantsFunction,
    WindowContentContainerStyleOverrides,
    WindowContentContainerVariantProps,
    WindowContentContainerVariantsFunction,
    WindowContentStyleOverrides,
    WindowContentVariantsFunction,
    WindowResizerStyleOverrides,
    WindowResizerVariantProps,
    WindowResizerVariantsFunction,
    WindowStyleOverrides,
    WindowTitleBarActionStyleOverrides,
    WindowTitleBarActionVariantsFunction,
    WindowTitleBarStyleOverrides,
    WindowTitleBarVariantProps,
    WindowTitleBarVariantsFunction,
    WindowTitleContainerStyleOverrides,
    WindowTitleContainerVariantsFunction,
    WindowTitleStyleOverrides,
    WindowTitleVariantProps,
    WindowTitleVariantsFunction
} from "./window.types";

export function createWindowBaseVariants(
    base: WindowBaseVariantsFunction,
    overrides: readonly WindowStyleOverrides[],
    theme: ThemeStyle
): WindowBaseVariantsFunction {
    const baseOverrides = activeOverrides(overrides, theme)
        .map(override => override.base)
        .filter((override): override is WindowBaseStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: WindowBaseVariantProps = { ...props, rounded: props.rounded ?? "medium" };
        const classes: ClassValue[] = [base(props)];

        for (const override of baseOverrides) {
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

export function createWindowContentContainerVariants(
    base: WindowContentContainerVariantsFunction,
    overrides: readonly WindowStyleOverrides[],
    theme: ThemeStyle
): WindowContentContainerVariantsFunction {
    const contentContainerOverrides = activeOverrides(overrides, theme)
        .map(override => override.contentContainer)
        .filter((override): override is WindowContentContainerStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: WindowContentContainerVariantProps = { ...props, rounded: props.rounded ?? "medium" };
        const classes: ClassValue[] = [base(props)];

        for (const override of contentContainerOverrides) {
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

export function createWindowContentVariants(
    base: WindowContentVariantsFunction,
    overrides: readonly WindowStyleOverrides[],
    theme: ThemeStyle
): WindowContentVariantsFunction {
    const contentOverrides = activeOverrides(overrides, theme)
        .map(override => override.content)
        .filter((override): override is WindowContentStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of contentOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

export function createWindowResizerVariants(
    base: WindowResizerVariantsFunction,
    overrides: readonly WindowStyleOverrides[],
    theme: ThemeStyle
): WindowResizerVariantsFunction {
    const resizerOverrides = activeOverrides(overrides, theme)
        .map(override => override.resizer)
        .filter((override): override is WindowResizerStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: WindowResizerVariantProps = { ...props };
        const classes: ClassValue[] = [base(props)];

        for (const override of resizerOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.position, resolvedProps.position));

            for (const compoundVariant of override.compoundVariants ?? []) {
                if (matchesCompoundVariant(compoundVariant.when, resolvedProps)) {
                    classes.push(compoundVariant.class);
                }
            }
        }

        return twMerge(cx(...classes));
    };
}

export function createWindowTitleBarActionVariants(
    base: WindowTitleBarActionVariantsFunction,
    overrides: readonly WindowStyleOverrides[],
    theme: ThemeStyle
): WindowTitleBarActionVariantsFunction {
    const titleBarActionOverrides = activeOverrides(overrides, theme)
        .map(override => override.titleBarAction)
        .filter((override): override is WindowTitleBarActionStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of titleBarActionOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

export function createWindowTitleBarVariants(
    base: WindowTitleBarVariantsFunction,
    overrides: readonly WindowStyleOverrides[],
    theme: ThemeStyle
): WindowTitleBarVariantsFunction {
    const titleBarOverrides = activeOverrides(overrides, theme)
        .map(override => override.titleBar)
        .filter((override): override is WindowTitleBarStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: WindowTitleBarVariantProps = {
            ...props,
            look: props.look ?? "default",
            rounded: props.rounded ?? "medium"
        };
        const classes: ClassValue[] = [base(props)];

        for (const override of titleBarOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.look, resolvedProps.look));
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

export function createWindowTitleContainerVariants(
    base: WindowTitleContainerVariantsFunction,
    overrides: readonly WindowStyleOverrides[],
    theme: ThemeStyle
): WindowTitleContainerVariantsFunction {
    const titleContainerOverrides = activeOverrides(overrides, theme)
        .map(override => override.titleContainer)
        .filter((override): override is WindowTitleContainerStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of titleContainerOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

export function createWindowTitleVariants(
    base: WindowTitleVariantsFunction,
    overrides: readonly WindowStyleOverrides[],
    theme: ThemeStyle
): WindowTitleVariantsFunction {
    const titleOverrides = activeOverrides(overrides, theme)
        .map(override => override.title)
        .filter((override): override is WindowTitleStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: WindowTitleVariantProps = { ...props, look: props.look ?? "default" };
        const classes: ClassValue[] = [base(props)];

        for (const override of titleOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.look, resolvedProps.look));

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
    overrides: readonly WindowStyleOverrides[],
    theme: ThemeStyle
): readonly WindowStyleOverrides[] {
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
