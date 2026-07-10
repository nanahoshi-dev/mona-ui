/*
 * Public API Surface of @nanahoshi/mona-ui/chip
 */

export { ChipComponent } from "./component/chip.component";
export { ChipPrefixTemplateDirective } from "./directives/chip-prefix-template.directive";
export { CHIP_STYLE_OVERRIDES, CHIP_STYLE_STRATEGY, createChipStyleStrategy, provideChipStyles } from "./styles/chip.styles";
export type {
    ChipCompoundStyleOverride,
    ChipStyleOverrides,
    ChipStyleStrategy,
    ChipStylesProviderConfig,
    ChipVariantInputs,
    ChipVariantProps,
    ChipVariantsFunction
} from "./styles/chip.styles";
