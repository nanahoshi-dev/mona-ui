/*
 * Public API Surface of @nanahoshi/mona-ui/editor
 */

export * from "./components/editor/editor.component";

export type { ContentChangeEvent } from "./models/ContentChangeEvent";
export type { EditorSettings } from "./models/EditorSettings";

export {
    createEditorStyleStrategy,
    EDITOR_STYLE_OVERRIDES,
    EDITOR_STYLE_STRATEGY,
    provideEditorStyles
} from "./styles/editor.styles";
export type {
    EditorStyleOverrides,
    EditorStylesProviderConfig,
    EditorStyleStrategy,
    EditorVariantsFunctions
} from "./styles/editor.styles";
