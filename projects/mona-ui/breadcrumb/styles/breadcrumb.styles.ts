import { VariantProps } from "class-variance-authority";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import {
    breadcrumbCurrentItemVariants as monaBreadcrumbCurrentItemVariants,
    breadcrumbListVariants as monaBreadcrumbListVariants,
    breadcrumbListItemVariants as monaBreadcrumbListItemVariants
} from "./breadcrumb.mona.styles";

const breadcrumbListThemeVariantsStrategy = createThemeStrategy(
    { mona: monaBreadcrumbListVariants },
    monaBreadcrumbListVariants
);

export const breadcrumbListThemeVariants = (theme: ThemeStyle) => breadcrumbListThemeVariantsStrategy.resolve(theme);

const breadcrumbListItemThemeVariantsStrategy = createThemeStrategy(
    { mona: monaBreadcrumbListItemVariants },
    monaBreadcrumbListItemVariants
);

export const breadcrumbListItemThemeVariants = (theme: ThemeStyle) =>
    breadcrumbListItemThemeVariantsStrategy.resolve(theme);

const breadcrumbCurrentItemThemeVariantsStrategy = createThemeStrategy(
    { mona: monaBreadcrumbCurrentItemVariants },
    monaBreadcrumbCurrentItemVariants
);

export const breadcrumbCurrentItemThemeVariants = (theme: ThemeStyle) =>
    breadcrumbCurrentItemThemeVariantsStrategy.resolve(theme);

type BreadcrumbListVariantProps = VariantProps<ReturnType<typeof breadcrumbListThemeVariants>>;
type BreadcrumbListVariantInput = VariantInputs<BreadcrumbListVariantProps>;

export type BreadcrumbListItemVariantProps = VariantProps<ReturnType<typeof breadcrumbListItemThemeVariants>>;
export type BreadcrumbListItemVariantInput = VariantInputs<BreadcrumbListItemVariantProps>;

export type BreadcrumbVariantProps = BreadcrumbListVariantProps & BreadcrumbListItemVariantProps;
export type BreadcrumbVariantInput = BreadcrumbListVariantInput & Omit<BreadcrumbListItemVariantInput, "listDisabled">;
