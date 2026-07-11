/*
 * Public API Surface of @nanahoshi/mona-ui/popover
 */

export * from "./components/popover/popover.component";

export * from "./directives/popover-footer-template.directive";
export * from "./directives/popover-title-template.directive";

export * from "./models/PopoverHideEvent";
export * from "./models/PopoverShowEvent";
export * from "./models/PopoverShownEvent";
export * from "./models/PopoverTrigger";

export {
    createPopoverStyleStrategy,
    POPOVER_STYLE_OVERRIDES,
    POPOVER_STYLE_STRATEGY,
    popoverArrowThemeVariants,
    providePopoverStyles
} from "./styles/popover.styles";
export type {
    PopoverArrowVariantInputs,
    PopoverArrowVariantProps,
    PopoverBaseCompoundStyleOverride,
    PopoverBaseStyleOverrides,
    PopoverBaseVariantInputs,
    PopoverBaseVariantProps,
    PopoverContentStyleOverrides,
    PopoverContentVariantInputs,
    PopoverContentVariantProps,
    PopoverHeaderCompoundStyleOverride,
    PopoverHeaderStyleOverrides,
    PopoverHeaderVariantInputs,
    PopoverHeaderVariantProps,
    PopoverStyleOverrides,
    PopoverStylesProviderConfig,
    PopoverStyleStrategy,
    PopoverVariantInputs,
    PopoverVariantProps,
    PopoverVariantsFunctions
} from "./styles/popover.styles";
