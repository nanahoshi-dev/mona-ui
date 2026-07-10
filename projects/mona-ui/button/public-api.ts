/*
 * Public API Surface of @nanahoshi/mona-ui/button
 */

export { ButtonDirective } from "./directives/button.directive";
export { ButtonService } from "./services/button.service";
export {
    BUTTON_STYLE_OVERRIDES,
    BUTTON_STYLE_STRATEGY,
    createButtonStyleStrategy,
    provideButtonStyles
} from "./styles/button.styles";
export type {
    ButtonCompoundStyleOverride,
    ButtonStyleOverrides,
    ButtonStyleStrategy,
    ButtonStylesProviderConfig,
    ButtonVariantProps,
    ButtonVariantsFunction,
    ButtonVariantsInput
} from "./styles/button.styles";
