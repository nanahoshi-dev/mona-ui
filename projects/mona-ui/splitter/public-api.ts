/*
 * Public API Surface of @nanahoshi/mona-ui/splitter
 */

export * from "./components/splitter/splitter.component";
export * from "./components/splitter-pane/splitter-pane.component";

export {
    createSplitterStyleStrategy,
    provideSplitterStyles,
    SPLITTER_STYLE_OVERRIDES,
    SPLITTER_STYLE_STRATEGY
} from "./styles/splitter.styles";
export type {
    SplitterBaseCompoundStyleOverride,
    SplitterBaseStyleOverrides,
    SplitterBaseVariantInput,
    SplitterBaseVariantProps,
    SplitterResizerCompoundStyleOverride,
    SplitterResizerHandleCompoundStyleOverride,
    SplitterResizerHandleStyleOverrides,
    SplitterResizerHandleVariantInput,
    SplitterResizerHandleVariantProps,
    SplitterResizerStyleOverrides,
    SplitterResizerVariantInput,
    SplitterResizerVariantProps,
    SplitterStyleOverrides,
    SplitterStylesProviderConfig,
    SplitterStyleStrategy,
    SplitterVariantInput,
    SplitterVariantProps,
    SplitterVariantsFunctions
} from "./styles/splitter.styles";
