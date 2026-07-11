import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type {
    NotificationActionVariantsFunction,
    NotificationBaseVariantsFunction,
    NotificationBodyVariantsFunction,
    NotificationContainerBaseVariantProps,
    NotificationContainerBaseVariantsFunction,
    NotificationContainerStyleOverrides,
    NotificationContentVariantsFunction,
    NotificationHeaderVariantsFunction,
    NotificationIconStyleOverrides,
    NotificationIconVariantProps,
    NotificationIconVariantsFunction,
    NotificationStyleOverrides,
    NotificationTextVariantsFunction
} from "./notification.types";

export function createNotificationContainerVariants(
    base: NotificationContainerBaseVariantsFunction,
    overrides: readonly NotificationStyleOverrides[],
    theme: ThemeStyle
): NotificationContainerBaseVariantsFunction {
    const containerOverrides = activeOverrides(overrides, theme)
        .map(override => override.container)
        .filter((override): override is NotificationContainerStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: NotificationContainerBaseVariantProps = { ...props };
        const classes: ClassValue[] = [base(props)];

        for (const override of containerOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.position, resolvedProps.position));
            classes.push(resolveVariantClass(override.positionType, resolvedProps.positionType));
        }

        return twMerge(cx(...classes));
    };
}

export function createNotificationActionVariants(
    base: NotificationActionVariantsFunction,
    overrides: readonly NotificationStyleOverrides[],
    theme: ThemeStyle
): NotificationActionVariantsFunction {
    return createStaticVariants(base, overrides, theme, override => override.action);
}

export function createNotificationBaseVariants(
    base: NotificationBaseVariantsFunction,
    overrides: readonly NotificationStyleOverrides[],
    theme: ThemeStyle
): NotificationBaseVariantsFunction {
    return createStaticVariants(base, overrides, theme, override => override.base);
}

export function createNotificationBodyVariants(
    base: NotificationBodyVariantsFunction,
    overrides: readonly NotificationStyleOverrides[],
    theme: ThemeStyle
): NotificationBodyVariantsFunction {
    return createStaticVariants(base, overrides, theme, override => override.body);
}

export function createNotificationContentVariants(
    base: NotificationContentVariantsFunction,
    overrides: readonly NotificationStyleOverrides[],
    theme: ThemeStyle
): NotificationContentVariantsFunction {
    return createStaticVariants(base, overrides, theme, override => override.content);
}

export function createNotificationHeaderVariants(
    base: NotificationHeaderVariantsFunction,
    overrides: readonly NotificationStyleOverrides[],
    theme: ThemeStyle
): NotificationHeaderVariantsFunction {
    return createStaticVariants(base, overrides, theme, override => override.header);
}

export function createNotificationTextVariants(
    base: NotificationTextVariantsFunction,
    overrides: readonly NotificationStyleOverrides[],
    theme: ThemeStyle
): NotificationTextVariantsFunction {
    return createStaticVariants(base, overrides, theme, override => override.text);
}

export function createNotificationIconVariants(
    base: NotificationIconVariantsFunction,
    overrides: readonly NotificationStyleOverrides[],
    theme: ThemeStyle
): NotificationIconVariantsFunction {
    const iconOverrides = activeOverrides(overrides, theme)
        .map(override => override.icon)
        .filter((override): override is NotificationIconStyleOverrides => override !== undefined);

    return (props = {}) => {
        const resolvedProps: NotificationIconVariantProps = { ...props };
        const classes: ClassValue[] = [base(props)];

        for (const override of iconOverrides) {
            classes.push(override.base);
            classes.push(resolveVariantClass(override.type, resolvedProps.type));
        }

        return twMerge(cx(...classes));
    };
}

function createStaticVariants<TStyleOverrides extends { readonly base?: ClassValue }>(
    base: () => string,
    overrides: readonly NotificationStyleOverrides[],
    theme: ThemeStyle,
    select: (override: NotificationStyleOverrides) => TStyleOverrides | undefined
): () => string {
    const staticOverrides = activeOverrides(overrides, theme)
        .map(select)
        .filter((override): override is TStyleOverrides => override !== undefined);

    return () => {
        const classes: ClassValue[] = [base()];

        for (const override of staticOverrides) {
            classes.push(override.base);
        }

        return twMerge(cx(...classes));
    };
}

function activeOverrides(
    overrides: readonly NotificationStyleOverrides[],
    theme: ThemeStyle
): readonly NotificationStyleOverrides[] {
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
