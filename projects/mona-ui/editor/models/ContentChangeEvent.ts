import type { JSONContent } from "@tiptap/core";

/** The content of the editor after a user change, emitted by `EditorComponent.update`. */
export interface ContentChangeEvent {
    /** The content as HTML, the same as the editor's `html` property. */
    html: string;
    /** The content as a `JSONContent` document, the same as the editor's `json` property. */
    json: JSONContent;
}
