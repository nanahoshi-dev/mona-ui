/*
 * Public API Surface of @nanahoshi/mona-ui/text-box
 */

export * from "./components/text-box/text-box.component";
export * from "./directives/text-box.directive";
export * from "./directives/text-box-prefix-template.directive";
export * from "./directives/text-box-suffix-template.directive";
export * from "./models/InputType";
export {
    createTextBoxStyleStrategy,
    provideTextBoxStyles,
    textBoxThemeVariants,
    TEXT_BOX_STYLE_OVERRIDES,
    TEXT_BOX_STYLE_STRATEGY
} from "./styles/textbox.styles";
export type {
    TextBoxBaseStyleOverride,
    TextBoxBaseVariantProps,
    TextBoxInputStyleOverride,
    TextBoxInputVariantInput,
    TextBoxInputVariantProps,
    TextBoxStyleOverrides,
    TextBoxStylesProviderConfig,
    TextBoxStyleStrategy,
    TextBoxVariantInput,
    TextBoxVariantProps,
    TextBoxVariantsBundle
} from "./styles/textbox.styles";
