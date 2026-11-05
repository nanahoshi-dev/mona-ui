export interface EditorSettings {
    alignment: boolean;
    blockquote: boolean;
    bold: boolean;
    code: boolean;
    fontColor: boolean;
    fontFamily: boolean;
    fontHighlight: boolean;
    fontList: Iterable<string>;
    fontSize: boolean;

    /**
     * The font sizes the font size dropdown offers, as CSS lengths (`"14px"`, `"1.25rem"`). Empty keeps the
     * default list.
     */
    fontSizeList: Iterable<string>;
    headings: boolean;
    history: boolean;
    horizontalRule: boolean;
    image: boolean;
    indent: boolean;
    italic: boolean;
    link: boolean;
    list: boolean;
    strikethrough: boolean;
    subscript: boolean;
    superscript: boolean;
    table: boolean;
    taskList: boolean;
    underline: boolean;
}
