/*
 * Public API Surface of @nanahoshi/mona-ui/masked-text-box
 */

export { MaskedTextBoxComponent } from "./components/masked-text-box/masked-text-box.component";
export { MaskedTextBoxPrefixTemplateDirective } from "./directives/masked-text-box-prefix-template.directive";
export { MaskedTextBoxSuffixTemplateDirective } from "./directives/masked-text-box-suffix-template.directive";
export { MASKED_TEXT_BOX_DEFAULT_MESSAGES } from "./i18n/masked-text-box.default-messages";
export type { MaskOptions, MaskRules } from "./models/MaskRules";
export type { MaskedTextBoxVariantProps } from "./styles/masked-text-box.styles";
export { formatMaskedValue, isMaskComplete } from "./utils/mask";
