/**
 * The features of an editor. Every feature is on unless it is set to `false`. Turning one off removes its toolbar
 * control, and the editor no longer keeps that kind of content.
 */
export interface EditorSettings {
    /** Whether the toolbar shows the text alignment buttons and the editor keeps paragraph and heading alignment. */
    alignment: boolean;
    /** Whether the toolbar shows the block quote button and the editor keeps block quotes. */
    blockquote: boolean;
    /** Whether the toolbar shows the bold button and the editor keeps bold text. */
    bold: boolean;
    /** Whether the toolbar shows the code block button and the editor keeps code blocks and inline code. */
    code: boolean;
    /** Whether the toolbar shows the text color picker and the editor keeps text colors. */
    fontColor: boolean;
    /** Whether the toolbar shows the font family dropdown and the editor keeps font families. */
    fontFamily: boolean;
    /** Whether the toolbar shows the highlight color picker and the editor keeps highlighted text. */
    fontHighlight: boolean;
    /** The fonts the font family dropdown offers, as CSS font family names. Empty keeps the default list. */
    fontList: Iterable<string>;
    /** Whether the toolbar shows the font size dropdown and the editor keeps font sizes. */
    fontSize: boolean;

    /**
     * The font sizes the font size dropdown offers, as CSS lengths (`"14px"`, `"1.25rem"`). Empty keeps the
     * default list.
     */
    fontSizeList: Iterable<string>;
    /** Whether the toolbar shows the format dropdown and the editor keeps headings. */
    headings: boolean;
    /** Whether the toolbar shows the undo and redo buttons and the editor keeps an undo history. */
    history: boolean;
    /** Whether the toolbar shows the horizontal line button and the editor keeps horizontal lines. */
    horizontalRule: boolean;
    /** Whether the toolbar shows the insert image button and the editor keeps images. */
    image: boolean;
    /** Whether the toolbar shows the indent and outdent buttons and the editor keeps indentation. */
    indent: boolean;
    /** Whether the toolbar shows the italic button and the editor keeps italic text. */
    italic: boolean;
    /** Whether the toolbar shows the link buttons and the editor keeps links, turning typed URLs into links. */
    link: boolean;
    /** Whether the toolbar shows the numbered and bulleted list buttons and the editor keeps those lists. */
    list: boolean;
    /** Whether the toolbar shows the strikethrough button and the editor keeps struck-through text. */
    strikethrough: boolean;
    /** Whether the toolbar shows the subscript button and the editor keeps subscript text. */
    subscript: boolean;
    /** Whether the toolbar shows the superscript button and the editor keeps superscript text. */
    superscript: boolean;
    /** Whether the toolbar shows the table buttons and the editor keeps tables. */
    table: boolean;
    /** Whether the toolbar shows the task list button and the editor keeps task lists. */
    taskList: boolean;
    /** Whether the toolbar shows the underline button and the editor keeps underlined text. */
    underline: boolean;
}
