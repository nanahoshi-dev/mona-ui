import { type ThemeStyle, createInheritedThemeStrategy } from "@nanahoshi/mona-ui/theme";
import {
    breadcrumbCurrentItemVariants as monaBreadcrumbCurrentItemVariants,
    breadcrumbListItemVariants as monaBreadcrumbListItemVariants,
    breadcrumbListVariants as monaBreadcrumbListVariants
} from "./breadcrumb.mona.styles";
import {
    reinaBreadcrumbCurrentItemVariants,
    reinaBreadcrumbListItemVariants,
    reinaBreadcrumbListVariants
} from "./breadcrumb.reina.styles";
import {
    createBreadcrumbCurrentItemVariants,
    createBreadcrumbListItemVariants,
    createBreadcrumbListVariants
} from "./breadcrumb.style-composition";
import type {
    BreadcrumbCurrentItemVariantsFunction,
    BreadcrumbListItemVariantsFunction,
    BreadcrumbListVariantsFunction,
    BreadcrumbStyleOverrides,
    BreadcrumbStyleStrategy,
    BreadcrumbVariantsFunctions
} from "./breadcrumb.types";

const defaultBreadcrumbListStrategy = createInheritedThemeStrategy<BreadcrumbListVariantsFunction>(
    monaBreadcrumbListVariants,
    { reina: reinaBreadcrumbListVariants }
);
const defaultBreadcrumbListItemStrategy = createInheritedThemeStrategy<BreadcrumbListItemVariantsFunction>(
    monaBreadcrumbListItemVariants,
    { reina: reinaBreadcrumbListItemVariants }
);
const defaultBreadcrumbCurrentItemStrategy = createInheritedThemeStrategy<BreadcrumbCurrentItemVariantsFunction>(
    monaBreadcrumbCurrentItemVariants,
    { reina: reinaBreadcrumbCurrentItemVariants }
);

export const breadcrumbListThemeVariants = (theme: ThemeStyle): BreadcrumbListVariantsFunction =>
    defaultBreadcrumbListStrategy.resolve(theme);

export const breadcrumbListItemThemeVariants = (theme: ThemeStyle): BreadcrumbListItemVariantsFunction =>
    defaultBreadcrumbListItemStrategy.resolve(theme);

export const breadcrumbCurrentItemThemeVariants = (theme: ThemeStyle): BreadcrumbCurrentItemVariantsFunction =>
    defaultBreadcrumbCurrentItemStrategy.resolve(theme);

export function createBreadcrumbStyleStrategy(
    overrides: readonly BreadcrumbStyleOverrides[] = []
): BreadcrumbStyleStrategy {
    const mona: BreadcrumbVariantsFunctions = {
        list: createBreadcrumbListVariants(monaBreadcrumbListVariants, overrides, "mona"),
        listItem: createBreadcrumbListItemVariants(monaBreadcrumbListItemVariants, overrides, "mona"),
        currentItem: createBreadcrumbCurrentItemVariants(monaBreadcrumbCurrentItemVariants, overrides, "mona")
    };
    const reina: BreadcrumbVariantsFunctions = {
        list: createBreadcrumbListVariants(reinaBreadcrumbListVariants, overrides, "reina"),
        listItem: createBreadcrumbListItemVariants(reinaBreadcrumbListItemVariants, overrides, "reina"),
        currentItem: createBreadcrumbCurrentItemVariants(reinaBreadcrumbCurrentItemVariants, overrides, "reina")
    };
    return createInheritedThemeStrategy<BreadcrumbVariantsFunctions>(mona, { reina: reina });
}
