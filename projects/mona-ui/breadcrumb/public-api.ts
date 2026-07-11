/*
 * Public API Surface of @nanahoshi/mona-ui/breadcrumb
 */

export * from "./components/breadcrumb/breadcrumb.component";
export * from "./components/breadcrumb-item/breadcrumb-item.component";

export * from "./directives/breadcrumb-separator-template.directive";

export {
    BREADCRUMB_STYLE_OVERRIDES,
    BREADCRUMB_STYLE_STRATEGY,
    createBreadcrumbStyleStrategy,
    provideBreadcrumbStyles
} from "./styles/breadcrumb.styles";
export type {
    BreadcrumbCurrentItemStyleOverrides,
    BreadcrumbCurrentItemVariantProps,
    BreadcrumbListItemCompoundStyleOverride,
    BreadcrumbListItemStyleOverrides,
    BreadcrumbListItemVariantInput,
    BreadcrumbListItemVariantProps,
    BreadcrumbListStyleOverrides,
    BreadcrumbListVariantInput,
    BreadcrumbListVariantProps,
    BreadcrumbStyleOverrides,
    BreadcrumbStylesProviderConfig,
    BreadcrumbStyleStrategy,
    BreadcrumbVariantInput,
    BreadcrumbVariantProps,
    BreadcrumbVariantsFunctions
} from "./styles/breadcrumb.styles";
