import { cx } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import {
    reinaPopupMenuBaseVariants,
    reinaPopupMenuContainerVariants,
    reinaPopupMenuGroupHeaderVariants,
    reinaPopupMenuIconContainerVariants,
    reinaPopupMenuItemVariants,
    reinaPopupMenuLinkVariants
} from "./popup-menu.reina.styles";
import {
    popupMenuBaseVariants as monaPopupMenuBaseVariants,
    popupMenuContainerVariants as monaPopupMenuContainerVariants,
    popupMenuGroupHeaderVariants as monaPopupMenuGroupHeaderVariants,
    popupMenuIconContainerVariants as monaPopupMenuIconContainerVariants,
    popupMenuItemVariants as monaPopupMenuItemVariants,
    popupMenuLinkVariants as monaPopupMenuLinkVariants
} from "./popup-menu.mona.styles";
import type {
    PopupMenuBaseVariantProps,
    PopupMenuContainerVariantProps,
    PopupMenuGroupHeaderVariantProps,
    PopupMenuItemVariantProps,
    PopupMenuStyleOverrides,
    PopupMenuVariantsBundle
} from "./popup-menu.types";

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
    overrides: readonly PopupMenuStyleOverrides[],
    theme: ThemeStyle
): readonly PopupMenuStyleOverrides[] {
    return overrides.filter(override => override.theme === undefined || override.theme === theme);
}

export function createPopupMenuVariants(
    baseVariants: typeof monaPopupMenuBaseVariants,
    containerVariants: typeof monaPopupMenuContainerVariants,
    groupHeaderVariants: typeof monaPopupMenuGroupHeaderVariants,
    iconContainerVariants: typeof monaPopupMenuIconContainerVariants,
    itemVariants: typeof monaPopupMenuItemVariants,
    linkVariants: typeof monaPopupMenuLinkVariants,
    overrides: readonly PopupMenuStyleOverrides[],
    theme: ThemeStyle
): PopupMenuVariantsBundle {
    const relevant = activeOverrides(overrides, theme);

    return {
        base: (props: PopupMenuBaseVariantProps = {}) => {
            const resolvedRounded = props.rounded ?? "medium";
            const classes: ClassValue[] = [baseVariants(props)];
            for (const override of relevant) {
                classes.push(override.base?.root);
                classes.push(resolveVariantClass(override.base?.rounded, resolvedRounded));
            }
            return twMerge(cx(...classes));
        },
        container: (props: PopupMenuContainerVariantProps = {}) => {
            const resolvedRounded = props.rounded ?? "medium";
            const classes: ClassValue[] = [containerVariants(props)];
            for (const override of relevant) {
                classes.push(override.container?.root);
                classes.push(resolveVariantClass(override.container?.rounded, resolvedRounded));
            }
            return twMerge(cx(...classes));
        },
        groupHeader: (props: PopupMenuGroupHeaderVariantProps = {}) => {
            const resolvedSize = props.size ?? "medium";
            const classes: ClassValue[] = [groupHeaderVariants(props)];
            for (const override of relevant) {
                classes.push(override.groupHeader?.root);
                classes.push(resolveVariantClass(override.groupHeader?.size, resolvedSize));
            }
            return twMerge(cx(...classes));
        },
        iconContainer: () => {
            const classes: ClassValue[] = [iconContainerVariants()];
            for (const override of relevant) {
                classes.push(override.iconContainer?.root);
            }
            return twMerge(cx(...classes));
        },
        item: (props: PopupMenuItemVariantProps = {}) => {
            const resolvedRounded = props.rounded ?? "medium";
            const resolvedSize = props.size ?? "medium";
            const classes: ClassValue[] = [itemVariants(props)];
            for (const override of relevant) {
                classes.push(override.item?.root);
                classes.push(resolveVariantClass(override.item?.rounded, resolvedRounded));
                classes.push(resolveVariantClass(override.item?.size, resolvedSize));
            }
            return twMerge(cx(...classes));
        },
        link: () => {
            const classes: ClassValue[] = [linkVariants()];
            for (const override of relevant) {
                classes.push(override.link?.root);
            }
            return twMerge(cx(...classes));
        }
    };
}

export function createMonaPopupMenuVariants(
    overrides: readonly PopupMenuStyleOverrides[],
    theme: ThemeStyle
): PopupMenuVariantsBundle {
    return createPopupMenuVariants(
        monaPopupMenuBaseVariants,
        monaPopupMenuContainerVariants,
        monaPopupMenuGroupHeaderVariants,
        monaPopupMenuIconContainerVariants,
        monaPopupMenuItemVariants,
        monaPopupMenuLinkVariants,
        overrides,
        theme
    );
}

export function createReinaPopupMenuVariants(
    overrides: readonly PopupMenuStyleOverrides[],
    theme: ThemeStyle
): PopupMenuVariantsBundle {
    return createPopupMenuVariants(
        reinaPopupMenuBaseVariants,
        reinaPopupMenuContainerVariants,
        reinaPopupMenuGroupHeaderVariants,
        reinaPopupMenuIconContainerVariants,
        reinaPopupMenuItemVariants,
        reinaPopupMenuLinkVariants,
        overrides,
        theme
    );
}
