/*
 * Public API Surface of @nanahoshi/mona-ui/multi-select
 */

export * from "./components/multi-select/multi-select.component";
export * from "./directives/multi-select-summary-tag.directive";
export * from "./directives/multi-select-summary-tag-template.directive";
export * from "./directives/multi-select-tag-template.directive";

export {
    createMultiSelectStyleStrategy,
    MULTI_SELECT_STYLE_OVERRIDES,
    MULTI_SELECT_STYLE_STRATEGY,
    provideMultiSelectStyles
} from "./styles/multi-select.styles";
export type {
    MultiSelectAffixContainerStyleOverrides,
    MultiSelectAffixContainerVariantInput,
    MultiSelectAffixContainerVariantProps,
    MultiSelectBaseCompoundStyleOverride,
    MultiSelectBaseStyleOverrides,
    MultiSelectBaseVariantInput,
    MultiSelectBaseVariantProps,
    MultiSelectIndicatorContainerCompoundStyleOverride,
    MultiSelectIndicatorContainerStyleOverrides,
    MultiSelectIndicatorContainerVariantInput,
    MultiSelectIndicatorContainerVariantProps,
    MultiSelectItemContainerCompoundStyleOverride,
    MultiSelectItemContainerStyleOverrides,
    MultiSelectItemContainerVariantInput,
    MultiSelectItemContainerVariantProps,
    MultiSelectStyleOverrides,
    MultiSelectStylesProviderConfig,
    MultiSelectStyleStrategy,
    MultiSelectVariantInput,
    MultiSelectVariantProps,
    MultiSelectVariantsFunctions
} from "./styles/multi-select.styles";
