export interface MonaEditorMessages {
    /** The label of the toolbar button that adds a column after the current one. */
    readonly addColumnAfter: string;
    /** The label of the toolbar button that adds a column before the current one. */
    readonly addColumnBefore: string;
    /** The label of the toolbar button that inserts a horizontal line. */
    readonly addHorizontalLine: string;
    /** The label of the toolbar button that adds a row after the current one. */
    readonly addRowAfter: string;
    /** The label of the toolbar button that adds a row before the current one. */
    readonly addRowBefore: string;
    /** The label of the toolbar button that centers the text. */
    readonly alignCenter: string;
    /** The label of the toolbar button that aligns the text to the end of the line. */
    readonly alignEnd: string;
    /** @deprecated No longer rendered: the toolbar aligns to the start and end with `alignStart` and `alignEnd`. */
    readonly alignLeft: string;
    /** @deprecated No longer rendered: the toolbar aligns to the start and end with `alignStart` and `alignEnd`. */
    readonly alignRight: string;
    /** The label of the toolbar button that aligns the text to the start of the line. */
    readonly alignStart: string;
    /** The accessible name of the toolbar's text alignment button group. */
    readonly alignmentGroup: string;
    /** The label of the alternative text field in the insert image form. */
    readonly altText: string;
    /** The label of the link dialog's button that sets the link. */
    readonly apply: string;
    /** The label of the toolbar color picker that sets the text's highlight color. */
    readonly backgroundColor: string;
    /** The label of the toolbar button that toggles bold. */
    readonly bold: string;
    /** The label of the Cancel button in the link dialog and the insert image form. */
    readonly cancel: string;
    /** The count under the content when `showCharacterCount` is set and there's no `characterLimit`. */
    readonly characterCount: (count: number) => string;
    /** Describes the content when it has a `characterLimit`, given the limit. Not shown, only read with the content. */
    readonly characterLimitHint: (limit: number) => string;
    /** The count under the content while it is within its `characterLimit`, given the characters left. */
    readonly charactersLeft: (count: number) => string;
    /** The count under the content once it is over its `characterLimit`, given the characters over it. */
    readonly charactersOver: (count: number) => string;
    /** The label of the toolbar button that toggles a code block. */
    readonly codeBlock: string;
    /** The label of the toolbar color picker that sets the text color. */
    readonly color: string;
    /** The accessible name of the editable content when the editor has no `aria-label` or `aria-labelledby`. */
    readonly contentLabel: string;
    /** The placeholder of the font family dropdown when the text uses no specific font. */
    readonly defaultFontFamily: string;
    /** The label of the toolbar button that deletes the current column. */
    readonly deleteColumn: string;
    /** The label of the toolbar button that deletes the current row. */
    readonly deleteRow: string;
    /** The label of the toolbar button that deletes the table. */
    readonly deleteTable: string;
    /** The title of the image form's window, and the label of the image button, when an image is selected. */
    readonly editImage: string;
    /** The title of the link dialog when the selection is already in a link. */
    readonly editLink: string;
    /** The label of the URL field in the link dialog. */
    readonly enterUrl: string;
    /** The placeholder of the font size dropdown when the text has no specific size. */
    readonly fontSize: string;
    /** The label of the toolbar dropdown that switches between paragraph and heading levels. */
    readonly format: string;
    /** The text of a heading level in the format dropdown, given the level number. */
    readonly heading: (level: number) => string;
    /** The label of the height field in the insert image form. */
    readonly heightPx: string;
    /** The accessible name of the toolbar's undo and redo button group. */
    readonly historyGroup: string;
    /** The accessible name of the file drop zone in the image form, shown when the editor has `imageUpload`. */
    readonly imageFile: string;
    /** Announced when a pasted or dropped image has uploaded and is in the content, given the file's name. */
    readonly imageInserted: (name: string) => string;
    /** Announced when a pasted or dropped image is larger than `imageMaxFileSize`, given its name and the size. */
    readonly imageTooLarge: (name: string, size: string) => string;
    /** Announced when a pasted or dropped image fails to upload, given the file's name. */
    readonly imageUploadFailed: (name: string) => string;
    /** Announced when a pasted or dropped image starts uploading, and names its placeholder, given the file's name. */
    readonly imageUploading: (name: string) => string;
    /** The label of the image URL field in the insert image form. */
    readonly imageUrl: string;
    /** The label of the toolbar button that increases the indentation. */
    readonly indent: string;
    /** The accessible name of the toolbar's indent and outdent button group. */
    readonly indentGroup: string;
    /** The label of the insert image form's button that inserts the image. */
    readonly insert: string;
    /** The label of the toolbar button that opens the insert image form, and the title of that form's window. */
    readonly insertImage: string;
    /** The label of the toolbar button that opens the link dialog, and the dialog's title for a new link. */
    readonly insertLink: string;
    /** The label of the toolbar button that toggles a numbered list. */
    readonly insertOrderedList: string;
    /** The label of the toolbar button that opens the table size grid, and the accessible name of that grid. */
    readonly insertTable: string;
    /** The label of the toolbar button that toggles a task list. */
    readonly insertTaskList: string;
    /** The label of the toolbar button that toggles a bulleted list. */
    readonly insertUnorderedList: string;
    /** The error shown in the link dialog when the URL isn't a valid link. */
    readonly invalidUrl: string;
    /** The label of the toolbar button that toggles italic. */
    readonly italic: string;
    /** The label of the toolbar button that justifies the text. */
    readonly justify: string;
    /** The accessible name of the toolbar's link button group. */
    readonly linkGroup: string;
    /** The accessible name of the toolbar's list button group. */
    readonly listGroup: string;
    /** Shown in the mention suggestions when the search finds no one. */
    readonly mentionNoResults: string;
    /** Announced when the mention suggestions change, given how many there are. */
    readonly mentionResults: (count: number) => string;
    /** Shown in the mention suggestions while the search runs. */
    readonly mentionSearching: string;
    /** The accessible name of the mention suggestions list. */
    readonly mentionSuggestions: string;
    /** The label of the toolbar button that merges the selected cells. */
    readonly mergeCells: string;
    /** The label of the toolbar button that decreases the indentation. */
    readonly outdent: string;
    /** The text of the plain paragraph option in the format dropdown. */
    readonly paragraph: string;
    /** The label of the toolbar button that toggles a block quote. */
    readonly quotation: string;
    /** The label of the toolbar button that redoes the last undone change. */
    readonly redo: string;
    /** The label of the toolbar button and the link dialog button that remove the link. */
    readonly removeLink: string;
    /** The label of the image form's button that applies the changes to a selected image. */
    readonly save: string;
    /** The label of the toolbar's font family dropdown. */
    readonly selectFontFamily: string;
    /** The label of the toolbar's font size dropdown. */
    readonly selectFontSize: string;
    /** The label of the toolbar button that splits a merged cell. */
    readonly splitCell: string;
    /** The label of the toolbar button that toggles strikethrough. */
    readonly strikethrough: string;
    /** The label of the toolbar button that toggles subscript. */
    readonly subscript: string;
    /** The label of the toolbar button that toggles superscript. */
    readonly superscript: string;
    /** The accessible name of the toolbar's table button group. */
    readonly tableGroup: string;
    /**
     * Describes a table size in the table size grid, given the number of rows and columns. It names each grid cell and
     * announces the highlighted size.
     */
    readonly tableSize: (rows: number, columns: number) => string;
    /** The accessible name of the toolbar's bold, italic and other text style button group. */
    readonly textStyleGroup: string;
    /** The label of the toolbar button that turns the header row on or off. */
    readonly toggleHeaderRow: string;
    /** The accessible name of the editor's toolbar. */
    readonly toolbar: string;
    /** The label of the toolbar button that toggles underline. */
    readonly underline: string;
    /** The label of the toolbar button that undoes the last change. */
    readonly undo: string;
    /** The label of the width field in the insert image form. */
    readonly widthPx: string;
    /** The count under the content when `showWordCount` is set, given the number of words. */
    readonly wordCount: (count: number) => string;
}
