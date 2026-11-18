/*
 * Public API Surface of @nanahoshi/mona-ui/multi-select
 */

export * from "./components/multi-select/multi-select.component";
export * from "./directives/multi-select-summary-tag.directive";
export * from "./directives/multi-select-summary-tag-template.directive";
export * from "./directives/multi-select-tag-template.directive";
export * from "./i18n/multi-select.default-messages";
export * from "./services/multi-select.service";

export {
    multiSelectAffixContainerThemeVariants,
    multiSelectBaseThemeVariants,
    multiSelectIndicatorContainerThemeVariants,
    multiSelectItemContainerThemeVariants
} from "./styles/multi-select.styles";
export type { MultiSelectVariantInput, MultiSelectVariantProps } from "./styles/multi-select.styles";
