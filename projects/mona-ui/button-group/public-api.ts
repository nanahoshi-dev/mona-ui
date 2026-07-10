/*
 * Public API Surface of @nanahoshi/mona-ui/button-group
 */

export { ButtonGroupComponent } from "./components/button-group/button-group.component";
export {
    BUTTON_GROUP_STYLE_OVERRIDES,
    BUTTON_GROUP_STYLE_STRATEGY,
    createButtonGroupStyleStrategy,
    provideButtonGroupStyles
} from "./styles/button-group.styles";
export type {
    ButtonGroupCompoundStyleOverride,
    ButtonGroupStyleOverrides,
    ButtonGroupStyleStrategy,
    ButtonGroupStylesProviderConfig,
    ButtonGroupVariantProps,
    ButtonGroupVariantsFunction,
    ButtonGroupVariantsInput
} from "./styles/button-group.styles";
