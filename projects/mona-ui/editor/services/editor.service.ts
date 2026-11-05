import { Injectable, signal } from "@angular/core";
import { any, ImmutableSet, List } from "@mirei/ts-collections";
import { type Content, Editor, type Extension, type JSONContent, type Mark, type Node } from "@tiptap/core";
import { Color } from "@tiptap/extension-color";
import { FontFamily } from "@tiptap/extension-font-family";
import { Highlight } from "@tiptap/extension-highlight";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Table } from "@tiptap/extension-table";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableRow } from "@tiptap/extension-table-row";
import { TaskItem } from "@tiptap/extension-task-item";
import { TaskList } from "@tiptap/extension-task-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import type { EditorState } from "@tiptap/pm/state";
import { StarterKit, type StarterKitOptions } from "@tiptap/starter-kit";
import { Subject } from "rxjs";
import { ExtendedImage } from "../extensions/ExtendedImage";
import { FontSize } from "../extensions/FontSize";
import { Indent } from "../extensions/Indent";
import type { EditorSettings } from "../models/EditorSettings";

type ExtensionTypes = Extension | Mark | Node;

/**
 * Options for creating the Tiptap editor.
 * @internal
 */
export interface EditorSetupOptions {
    /** The attributes of the editable element. */
    readonly attributes: Record<string, string>;
    /** The content of a new editor. A rebuilt editor keeps the document it had instead. */
    readonly content: string | JSONContent;
    /** Whether the content can be edited. */
    readonly editable: boolean;
}

const DEFAULT_FONTS = [
    "Arial",
    "Comic Sans MS",
    "Courier New",
    "Georgia",
    "Impact",
    "Lucida Console",
    "Lucida Sans Unicode",
    "Palatino Linotype",
    "Tahoma",
    "Times New Roman",
    "Trebuchet MS",
    "Verdana"
];

const DEFAULT_SETTINGS: EditorSettings = {
    alignment: true,
    blockquote: true,
    bold: true,
    code: true,
    fontColor: true,
    fontFamily: true,
    fontHighlight: true,
    fontList: [],
    fontSize: true,
    headings: true,
    history: true,
    horizontalRule: true,
    image: true,
    indent: true,
    italic: true,
    link: true,
    list: true,
    strikethrough: true,
    subscript: true,
    superscript: true,
    table: true,
    taskList: true,
    underline: true
};

/**
 * Wraps a single block node in a document; a document is used as it is.
 */
function toDocumentContent(content: string | JSONContent): Content {
    if (typeof content === "string" || content.type === "doc") {
        return content;
    }
    return { type: "doc", content: [content] };
}

@Injectable()
export class EditorService {
    readonly #ready = signal(false);
    readonly #state = signal<EditorState | null>(null);
    #editor: Editor | null = null;
    public readonly blur$ = new Subject<void>();
    public readonly create$ = new Subject<void>();
    public readonly focus$ = new Subject<void>();
    public readonly fontSizes = signal(
        ImmutableSet.create([
            "10px",
            "12px",
            "14px",
            "16px",
            "18px",
            "20px",
            "24px",
            "32px",
            "36px",
            "48px",
            "60px",
            "72px"
        ])
    );
    public readonly fonts = signal(ImmutableSet.create(DEFAULT_FONTS));

    /**
     * True while an editor exists. The toolbar renders only then, so its components can use {@link editor}.
     */
    public readonly ready = this.#ready.asReadonly();
    public readonly selectionUpdate$ = new Subject<void>();

    /**
     * The resolved settings of the current editor. Set before the editor is created, so the toolbar never renders a
     * feature the editor doesn't have.
     */
    public readonly settings = signal<Partial<EditorSettings>>({});
    public readonly state = this.#state.asReadonly();
    public readonly update$ = new Subject<void>();

    public destroy(): void {
        this.#editor?.destroy();
        this.#editor = null;
        this.#ready.set(false);
        this.blur$.complete();
        this.create$.complete();
        this.focus$.complete();
        this.selectionUpdate$.complete();
        this.update$.complete();
    }

    /**
     * Replaces the document without emitting an update, as for a value set from outside.
     */
    public setContent(content: string | JSONContent): void {
        this.#editor?.commands.setContent(toDocumentContent(content), { emitUpdate: false });
    }

    public setEditable(editable: boolean, attributes: Record<string, string>): void {
        if (!this.#editor) {
            return;
        }
        if (this.#editor.isEditable !== editable) {
            this.#editor.setEditable(editable, false);
        }
        this.#editor.setOptions({ editorProps: { attributes } });
    }

    /**
     * Creates the editor, or rebuilds it for new settings. A rebuilt editor keeps its document: it is carried over as
     * HTML, so content that a removed feature can't hold falls back to plain text instead of being lost.
     */
    public setupEditor(element: HTMLElement, settings: Partial<EditorSettings>, options: EditorSetupOptions): void {
        const content = this.#editor ? this.#editor.getHTML() : toDocumentContent(options.content);
        this.#editor?.destroy();
        this.#editor = null;

        const editorSettings: EditorSettings = { ...DEFAULT_SETTINGS, ...settings };
        const fontList = editorSettings.fontList;
        this.fonts.set(ImmutableSet.create(any(fontList) ? fontList : DEFAULT_FONTS));
        this.settings.set(editorSettings);

        const editor = new Editor({
            content,
            editable: options.editable,
            editorProps: { attributes: options.attributes },
            element,
            extensions: this.#getExtensions(editorSettings),
            onBlur: () => this.blur$.next(),
            onCreate: () => this.create$.next(),
            onFocus: () => this.focus$.next(),
            onSelectionUpdate: () => this.selectionUpdate$.next(),
            onTransaction: ({ editor: transactionEditor }) => this.#state.set(transactionEditor.state),
            onUpdate: () => this.update$.next()
        });
        this.#editor = editor;
        this.#state.set(editor.state);
        this.#ready.set(true);
    }

    /**
     * The Tiptap editor. Available while {@link ready} is true.
     */
    public get editor(): Editor {
        if (!this.#editor) {
            throw new Error("The editor has not been created yet.");
        }
        return this.#editor;
    }

    #getExtensions(settings: EditorSettings): ExtensionTypes[] {
        const extensions = new List<ExtensionTypes>();
        extensions.add(TextStyle);
        extensions.add(StarterKit.configure(this.#getStarterKitOptions(settings)));

        if (settings.alignment) {
            extensions.add(
                TextAlign.configure({
                    types: ["paragraph", "heading"]
                })
            );
        }
        if (settings.fontColor) {
            extensions.add(Color);
        }
        if (settings.fontFamily) {
            extensions.add(FontFamily);
        }
        if (settings.fontHighlight) {
            extensions.add(Highlight.configure({ multicolor: true }));
        }
        if (settings.fontSize) {
            extensions.add(FontSize);
        }
        if (settings.image) {
            extensions.add(ExtendedImage);
        }
        if (settings.indent) {
            extensions.add(Indent);
        }
        if (settings.subscript) {
            extensions.add(Subscript);
        }
        if (settings.superscript) {
            extensions.add(Superscript);
        }
        if (settings.table) {
            extensions.add(
                Table.configure({
                    resizable: true
                })
            );
            extensions.add(TableHeader);
            extensions.add(TableRow);
            extensions.add(TableCell);
        }
        if (settings.taskList) {
            extensions.add(TaskList);
            extensions.add(
                TaskItem.configure({
                    nested: true
                })
            );
        }
        return extensions.toArray();
    }

    /**
     * StarterKit 3 includes Link and Underline, so they are configured here rather than registered a second time.
     */
    #getStarterKitOptions(settings: EditorSettings): Partial<StarterKitOptions> {
        const options: Partial<StarterKitOptions> = {
            link: settings.link ? { autolink: true, openOnClick: "whenNotEditable" } : false
        };
        if (!settings.blockquote) {
            options.blockquote = false;
        }
        if (!settings.bold) {
            options.bold = false;
        }
        if (!settings.code) {
            options.code = false;
            options.codeBlock = false;
        }
        if (!settings.headings) {
            options.heading = false;
        }
        if (!settings.history) {
            options.undoRedo = false;
        }
        if (!settings.horizontalRule) {
            options.horizontalRule = false;
        }
        if (!settings.italic) {
            options.italic = false;
        }
        if (!settings.list) {
            options.bulletList = false;
            options.listItem = false;
            options.listKeymap = false;
            options.orderedList = false;
        }
        if (!settings.strikethrough) {
            options.strike = false;
        }
        if (!settings.underline) {
            options.underline = false;
        }
        return options;
    }
}
