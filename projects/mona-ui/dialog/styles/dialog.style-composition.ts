import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type {
    DialogBaseStyleOverrides,
    DialogBaseVariantProps,
    DialogBaseVariantsFunction,
    DialogBodyStyleOverrides,
    DialogBodyVariantProps,
    DialogBodyVariantsFunction,
    DialogCloseButtonContainerStyleOverrides,
    DialogCloseButtonContainerVariantsFunction,
    DialogContentContainerStyleOverrides,
    DialogContentContainerVariantsFunction,
    DialogContentStyleOverrides,
    DialogContentVariantsFunction,
    DialogDescriptionStyleOverrides,
    DialogDescriptionVariantsFunction,
    DialogFooterStyleOverrides,
    DialogFooterVariantProps,
    DialogFooterVariantsFunction,
    DialogHeaderStyleOverrides,
    DialogHeaderVariantsFunction,
    DialogIconContainerStyleOverrides,
    DialogIconContainerVariantsFunction,
    DialogIconStyleOverrides,
    DialogIconVariantProps,
    DialogIconVariantsFunction,
    DialogStyleOverrides,
    DialogTitleContainerStyleOverrides,
    DialogTitleContainerVariantsFunction,
    DialogTitleStyleOverrides,
    DialogTitleVariantsFunction
} from "./dialog.types";

export function createDialogBaseVariants(
    base: DialogBaseVariantsFunction,
    overrides: readonly DialogStyleOverrides[],
    theme: ThemeStyle
): DialogBaseVariantsFunction {
    const baseOverrides = activeOverrides(overrides, theme)
        .map(override => override.base)
        .filter((override): override is DialogBaseStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: DialogBaseVariantProps = { ...props, rounded: props.rounded ?? "medium" };
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

export function createDialogContentContainerVariants(
    base: DialogContentContainerVariantsFunction,
    overrides: readonly DialogStyleOverrides[],
    theme: ThemeStyle
): DialogContentContainerVariantsFunction {
    const contentContainerOverrides = activeOverrides(overrides, theme)
        .map(override => override.contentContainer)
        .filter((override): override is DialogContentContainerStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of contentContainerOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

export function createDialogBodyVariants(
    base: DialogBodyVariantsFunction,
    overrides: readonly DialogStyleOverrides[],
    theme: ThemeStyle
): DialogBodyVariantsFunction {
    const bodyOverrides = activeOverrides(overrides, theme)
        .map(override => override.body)
        .filter((override): override is DialogBodyStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: DialogBodyVariantProps = { ...props, hasIcon: props.hasIcon ?? false };
        const classes: ClassValue[] = [base(props)];

        for (const override of bodyOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.hasIcon, resolvedProps.hasIcon));

            for (const compoundVariant of override.compoundVariants ?? []) {
                if (matchesCompoundVariant(compoundVariant.when, resolvedProps)) {
                    classes.push(compoundVariant.class);
                }
            }
        }

        return twMerge(cx(...classes));
    };
}

export function createDialogHeaderVariants(
    base: DialogHeaderVariantsFunction,
    overrides: readonly DialogStyleOverrides[],
    theme: ThemeStyle
): DialogHeaderVariantsFunction {
    const headerOverrides = activeOverrides(overrides, theme)
        .map(override => override.header)
        .filter((override): override is DialogHeaderStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of headerOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

export function createDialogIconContainerVariants(
    base: DialogIconContainerVariantsFunction,
    overrides: readonly DialogStyleOverrides[],
    theme: ThemeStyle
): DialogIconContainerVariantsFunction {
    const iconContainerOverrides = activeOverrides(overrides, theme)
        .map(override => override.iconContainer)
        .filter((override): override is DialogIconContainerStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of iconContainerOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

export function createDialogIconVariants(
    base: DialogIconVariantsFunction,
    overrides: readonly DialogStyleOverrides[],
    theme: ThemeStyle
): DialogIconVariantsFunction {
    const iconOverrides = activeOverrides(overrides, theme)
        .map(override => override.icon)
        .filter((override): override is DialogIconStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: DialogIconVariantProps = { ...props, type: props.type ?? "info" };
        const classes: ClassValue[] = [base(props)];

        for (const override of iconOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.type, resolvedProps.type));

            for (const compoundVariant of override.compoundVariants ?? []) {
                if (matchesCompoundVariant(compoundVariant.when, resolvedProps)) {
                    classes.push(compoundVariant.class);
                }
            }
        }

        return twMerge(cx(...classes));
    };
}

export function createDialogTitleContainerVariants(
    base: DialogTitleContainerVariantsFunction,
    overrides: readonly DialogStyleOverrides[],
    theme: ThemeStyle
): DialogTitleContainerVariantsFunction {
    const titleContainerOverrides = activeOverrides(overrides, theme)
        .map(override => override.titleContainer)
        .filter((override): override is DialogTitleContainerStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of titleContainerOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

export function createDialogCloseButtonContainerVariants(
    base: DialogCloseButtonContainerVariantsFunction,
    overrides: readonly DialogStyleOverrides[],
    theme: ThemeStyle
): DialogCloseButtonContainerVariantsFunction {
    const closeButtonContainerOverrides = activeOverrides(overrides, theme)
        .map(override => override.closeButtonContainer)
        .filter((override): override is DialogCloseButtonContainerStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of closeButtonContainerOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

export function createDialogTitleVariants(
    base: DialogTitleVariantsFunction,
    overrides: readonly DialogStyleOverrides[],
    theme: ThemeStyle
): DialogTitleVariantsFunction {
    const titleOverrides = activeOverrides(overrides, theme)
        .map(override => override.title)
        .filter((override): override is DialogTitleStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of titleOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

export function createDialogDescriptionVariants(
    base: DialogDescriptionVariantsFunction,
    overrides: readonly DialogStyleOverrides[],
    theme: ThemeStyle
): DialogDescriptionVariantsFunction {
    const descriptionOverrides = activeOverrides(overrides, theme)
        .map(override => override.description)
        .filter((override): override is DialogDescriptionStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of descriptionOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

export function createDialogContentVariants(
    base: DialogContentVariantsFunction,
    overrides: readonly DialogStyleOverrides[],
    theme: ThemeStyle
): DialogContentVariantsFunction {
    const contentOverrides = activeOverrides(overrides, theme)
        .map(override => override.content)
        .filter((override): override is DialogContentStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of contentOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

export function createDialogFooterVariants(
    base: DialogFooterVariantsFunction,
    overrides: readonly DialogStyleOverrides[],
    theme: ThemeStyle
): DialogFooterVariantsFunction {
    const footerOverrides = activeOverrides(overrides, theme)
        .map(override => override.footer)
        .filter((override): override is DialogFooterStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: DialogFooterVariantProps = { ...props, rounded: props.rounded ?? "medium" };
        const classes: ClassValue[] = [base(props)];

        for (const override of footerOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.layout, resolvedProps.layout));
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
    overrides: readonly DialogStyleOverrides[],
    theme: ThemeStyle
): readonly DialogStyleOverrides[] {
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
