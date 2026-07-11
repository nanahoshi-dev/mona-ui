/*
 * Public API Surface of @nanahoshi/mona-ui/text-area
 */

export * from "./directives/text-area.directive";

export {
    createTextAreaStyleStrategy,
    provideTextAreaStyles,
    TEXT_AREA_STYLE_OVERRIDES,
    TEXT_AREA_STYLE_STRATEGY
} from "./styles/textarea.styles";
export type {
    TextAreaBaseCompoundStyleOverride,
    TextAreaBaseStyleOverrides,
    TextAreaStyleOverrides,
    TextAreaStylesProviderConfig,
    TextAreaStyleStrategy,
    TextAreaVariantInput,
    TextAreaVariantProps,
    TextAreaVariantsFunctions
} from "./styles/textarea.styles";
