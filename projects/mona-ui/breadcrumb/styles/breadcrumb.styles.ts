import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import {
    breadcrumbCurrentItemVariants as monaBreadcrumbCurrentItemVariants,
    breadcrumbListVariants as monaBreadcrumbListVariants,
    breadcrumbListItemVariants as monaBreadcrumbListItemVariants
} from "./breadcrumb.mona.styles";

export const breadcrumbListThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaBreadcrumbListVariants;
        default:
            return monaBreadcrumbListVariants;
    }
};

export const breadcrumbListItemThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaBreadcrumbListItemVariants;
        default:
            return monaBreadcrumbListItemVariants;
    }
};

export const breadcrumbCurrentItemThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaBreadcrumbCurrentItemVariants;
        default:
            return monaBreadcrumbCurrentItemVariants;
    }
};

type BreadcrumbListVariantProps = VariantProps<ReturnType<typeof breadcrumbListThemeVariants>>;
type BreadcrumbListVariantInput = VariantInputs<BreadcrumbListVariantProps>;

export type BreadcrumbListItemVariantProps = VariantProps<ReturnType<typeof breadcrumbListItemThemeVariants>>;
export type BreadcrumbListItemVariantInput = VariantInputs<BreadcrumbListItemVariantProps>;

export type BreadcrumbVariantProps = BreadcrumbListVariantProps & BreadcrumbListItemVariantProps;
export type BreadcrumbVariantInput = BreadcrumbListVariantInput & Omit<BreadcrumbListItemVariantInput, "listDisabled">;
