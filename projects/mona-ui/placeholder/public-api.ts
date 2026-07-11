/*
 * Public API Surface of @nanahoshi/mona-ui/placeholder
 */

export * from "./components/placeholder/placeholder.component";

export {
    createPlaceholderStyleStrategy,
    PLACEHOLDER_STYLE_OVERRIDES,
    PLACEHOLDER_STYLE_STRATEGY,
    providePlaceholderStyles
} from "./styles/placeholder.styles";
export type {
    PlaceholderBaseStyleOverrides,
    PlaceholderBaseVariantInput,
    PlaceholderBaseVariantProps,
    PlaceholderStyleOverrides,
    PlaceholderStylesProviderConfig,
    PlaceholderStyleStrategy,
    PlaceholderTextStyleOverrides,
    PlaceholderTextVariantInput,
    PlaceholderTextVariantProps,
    PlaceholderVariantInput,
    PlaceholderVariantProps,
    PlaceholderVariantsFunctions
} from "./styles/placeholder.styles";
