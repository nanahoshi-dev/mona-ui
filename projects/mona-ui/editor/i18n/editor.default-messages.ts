// Generated from i18n/catalogs/en-US.messages.json by scripts/generate-locale-catalogs.ts. Do not edit.
// Edit the JSON file and run `npm run generate:locale-catalogs`.

import { formatNumber, type MonaEditorMessages } from "@nanahoshi/mona-ui/i18n";

function localizeNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return formatNumber(value, "en-US", options);
}

const PLURAL_RULES = new Intl.PluralRules("en-US");

function plural(
    category: Intl.LDMLPluralRule,
    forms: Partial<Record<Intl.LDMLPluralRule, () => string>> & { readonly other: () => string }
): string {
    return (forms[category] ?? forms.other)();
}

export const EDITOR_DEFAULT_MESSAGES: MonaEditorMessages = {
    addColumnAfter: "Add column after",
    addColumnBefore: "Add column before",
    addHorizontalLine: "Add horizontal line",
    addRowAfter: "Add row after",
    addRowBefore: "Add row before",
    alignCenter: "Center text",
    alignEnd: "Align text to the end",
    alignLeft: "Align text left",
    alignRight: "Align text right",
    alignStart: "Align text to the start",
    alignmentGroup: "Alignment",
    altText: "Alt text",
    apply: "Apply",
    backgroundColor: "Background color",
    bold: "Bold",
    cancel: "Cancel",
    characterCount: (count: number) =>
        plural(PLURAL_RULES.select(count), {
            one: () => `${localizeNumber(count)} character`,
            other: () => `${localizeNumber(count)} characters`
        }),
    characterLimitHint: (limit: number) =>
        `You can enter up to ${plural(PLURAL_RULES.select(limit), { one: () => `${localizeNumber(limit)} character`, other: () => `${localizeNumber(limit)} characters` })}.`,
    charactersLeft: (count: number) =>
        plural(PLURAL_RULES.select(count), {
            one: () => `${localizeNumber(count)} character left`,
            other: () => `${localizeNumber(count)} characters left`
        }),
    charactersOver: (count: number) =>
        plural(PLURAL_RULES.select(count), {
            one: () => `${localizeNumber(count)} character too many`,
            other: () => `${localizeNumber(count)} characters too many`
        }),
    codeBlock: "Code block",
    color: "Color",
    contentLabel: "Rich text editor",
    defaultFontFamily: "Default font",
    deleteColumn: "Delete column",
    deleteRow: "Delete row",
    deleteTable: "Delete table",
    editImage: "Edit image",
    editLink: "Edit link",
    enterUrl: "Enter the URL",
    fontSize: "Font size",
    format: "Format",
    heading: (level: number) => `Heading ${localizeNumber(level)}`,
    heightPx: "Height (px)",
    historyGroup: "History",
    imageFile: "Image file",
    imageInserted: (name: string) => `${name} inserted.`,
    imageTooLarge: (name: string, size: string) => `${name} wasn't added. The file is larger than ${size}.`,
    imageUploadFailed: (name: string) => `${name} couldn't be uploaded.`,
    imageUploading: (name: string) => `Uploading ${name}`,
    imageUrl: "Image URL",
    indent: "Indent",
    indentGroup: "Indentation",
    insert: "Insert",
    insertImage: "Insert image",
    insertLink: "Insert link",
    insertOrderedList: "Insert ordered list",
    insertTable: "Insert table",
    insertTaskList: "Insert task list",
    insertUnorderedList: "Insert unordered list",
    invalidUrl: "Enter a web address, a mailto: or tel: link, or a relative path.",
    italic: "Italic",
    justify: "Justify",
    linkGroup: "Link",
    listGroup: "Lists",
    mentionNoResults: "No matches",
    mentionResults: (count: number) =>
        plural(PLURAL_RULES.select(count), {
            one: () => `${localizeNumber(count)} suggestion`,
            other: () => `${localizeNumber(count)} suggestions`
        }),
    mentionSearching: "Searching…",
    mentionSuggestions: "Suggestions",
    mergeCells: "Merge selected cells",
    outdent: "Outdent",
    paragraph: "Paragraph",
    quotation: "Quotation",
    redo: "Redo",
    removeLink: "Remove link",
    save: "Save",
    selectFontFamily: "Select font family",
    selectFontSize: "Select font size",
    splitCell: "Split cell",
    strikethrough: "Strikethrough",
    subscript: "Subscript",
    superscript: "Superscript",
    tableGroup: "Table",
    tableSize: (rows: number, columns: number) => `Rows: ${localizeNumber(rows)}, columns: ${localizeNumber(columns)}`,
    textStyleGroup: "Text style",
    toggleHeaderRow: "Toggle header row",
    toolbar: "Formatting",
    underline: "Underline",
    undo: "Undo",
    widthPx: "Width (px)",
    wordCount: (count: number) =>
        plural(PLURAL_RULES.select(count), {
            one: () => `${localizeNumber(count)} word`,
            other: () => `${localizeNumber(count)} words`
        })
};
