import { VariantProps } from "class-variance-authority";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import {
    breadcrumbCurrentItemVariants as annaBreadcrumbCurrentItemVariants,
    breadcrumbListVariants as annaBreadcrumbListVariants,
    breadcrumbListItemVariants as annaBreadcrumbListItemVariants
} from "./breadcrumb.anna.styles";
import {
    breadcrumbCurrentItemVariants as monaBreadcrumbCurrentItemVariants,
    breadcrumbListVariants as monaBreadcrumbListVariants,
    breadcrumbListItemVariants as monaBreadcrumbListItemVariants
} from "./breadcrumb.mona.styles";

export const breadcrumbListThemeVariants = createThemeStrategy({
    anna: annaBreadcrumbListVariants,
    mona: monaBreadcrumbListVariants
});

export const breadcrumbListItemThemeVariants = createThemeStrategy({
    anna: annaBreadcrumbListItemVariants,
    mona: monaBreadcrumbListItemVariants
});

export const breadcrumbCurrentItemThemeVariants = createThemeStrategy({
    anna: annaBreadcrumbCurrentItemVariants,
    mona: monaBreadcrumbCurrentItemVariants
});

type BreadcrumbListVariantProps = VariantProps<ReturnType<typeof breadcrumbListThemeVariants>>;
type BreadcrumbListVariantInput = VariantInputs<BreadcrumbListVariantProps>;

export type BreadcrumbListItemVariantProps = VariantProps<ReturnType<typeof breadcrumbListItemThemeVariants>>;
export type BreadcrumbListItemVariantInput = VariantInputs<BreadcrumbListItemVariantProps>;

export type BreadcrumbVariantProps = BreadcrumbListVariantProps & BreadcrumbListItemVariantProps;
export type BreadcrumbVariantInput = BreadcrumbListVariantInput & Omit<BreadcrumbListItemVariantInput, "listDisabled">;
