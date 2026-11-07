import {
    afterEveryRender,
    afterNextRender,
    booleanAttribute,
    Component,
    computed,
    DestroyRef,
    effect,
    type ElementRef,
    inject,
    input,
    model,
    output,
    signal,
    untracked,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { FormValueControl } from "@angular/forms/signals";
import { injectComponentDirection, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { injectEffectiveDisabled, RovingToolbar } from "@nanahoshi/mona-ui/internal";
import type { JSONContent } from "@tiptap/core";
import { twMerge } from "tailwind-merge";
import { EDITOR_DEFAULT_MESSAGES } from "../../i18n/editor.default-messages";
import type { ContentChangeEvent } from "../../models/ContentChangeEvent";
import type { EditorSettings } from "../../models/EditorSettings";
import { EditorService } from "../../services/editor.service";
import {
    editorBaseThemeVariants,
    editorContainerThemeVariants,
    editorPlaceholderThemeVariants,
    editorToolbarThemeVariants
} from "../../styles/editor.styles";
import { EditorBasicTextStylesComponent } from "../editor-basic-text-styles/editor-basic-text-styles.component";
import { EditorBlockquoteComponent } from "../editor-blockquote/editor-blockquote.component";
import { EditorCodeBlockComponent } from "../editor-code-block/editor-code-block.component";
import { EditorFontColorComponent } from "../editor-font-color/editor-font-color.component";
import { EditorFontFamilyComponent } from "../editor-font-family/editor-font-family.component";
import { EditorFontHighlightComponent } from "../editor-font-highlight/editor-font-highlight.component";
import { EditorFontSizeComponent } from "../editor-font-size/editor-font-size.component";
import { EditorHeadingsComponent } from "../editor-headings/editor-headings.component";
import { EditorHistoryComponent } from "../editor-history/editor-history.component";
import { EditorHorizontalRuleComponent } from "../editor-horizontal-rule/editor-horizontal-rule.component";
import { EditorImageComponent } from "../editor-image/editor-image.component";
import { EditorIndentComponent } from "../editor-indent/editor-indent.component";
import { EditorLinkComponent } from "../editor-link/editor-link.component";
import { EditorListComponent } from "../editor-list/editor-list.component";
import { EditorTableComponent } from "../editor-table/editor-table.component";
import { EditorTaskListComponent } from "../editor-task-list/editor-task-list.component";
import { EditorTextAlignmentsComponent } from "../editor-text-alignments/editor-text-alignments.component";

const EMPTY_DOCUMENT: JSONContent = { type: "doc", content: [] };

@Component({
    selector: "mona-editor",
    imports: [
        EditorBasicTextStylesComponent,
        EditorHeadingsComponent,
        EditorTextAlignmentsComponent,
        EditorFontSizeComponent,
        EditorFontColorComponent,
        EditorFontHighlightComponent,
        EditorBlockquoteComponent,
        EditorLinkComponent,
        EditorListComponent,
        EditorIndentComponent,
        EditorHistoryComponent,
        EditorFontFamilyComponent,
        EditorHorizontalRuleComponent,
        EditorTaskListComponent,
        EditorImageComponent,
        EditorTableComponent,
        EditorCodeBlockComponent
    ],
    templateUrl: "./editor.component.html",
    providers: [EditorService],
    host: {
        "[class]": "baseClass()",
        "[attr.aria-describedby]": "null",
        "[attr.aria-label]": "null",
        "[attr.aria-labelledby]": "null",
        "[attr.data-disabled]": "effectiveDisabled() || null",
        "[attr.data-invalid]": "invalidState() || null",
        "[attr.data-readonly]": "readonly() || null",
        "[attr.data-required]": "required() || null"
    }
})
export class EditorComponent implements FormValueControl<string> {
    readonly #contentAttributes = computed(() => {
        // Tiptap adds the role when it creates the view, but later attribute updates replace the whole set.
        const attributes: Record<string, string> = {
            "aria-multiline": "true",
            dir: this.#direction(),
            role: "textbox"
        };
        const ariaLabelledBy = this.ariaLabelledBy();
        if (ariaLabelledBy) {
            attributes["aria-labelledby"] = ariaLabelledBy;
        } else {
            attributes["aria-label"] = this.ariaLabel() || this.messages().contentLabel;
        }
        if (this.ariaDescribedBy()) {
            attributes["aria-describedby"] = this.ariaDescribedBy();
        }
        if (this.placeholder()) {
            attributes["aria-placeholder"] = this.placeholder();
        }
        if (this.effectiveDisabled()) {
            attributes["aria-disabled"] = "true";
        }
        if (this.readonly()) {
            attributes["aria-readonly"] = "true";
        }
        if (this.required()) {
            attributes["aria-required"] = "true";
        }
        if (this.invalidState()) {
            attributes["aria-invalid"] = "true";
        }
        return attributes;
    });
    readonly #destroyRef = inject(DestroyRef);
    readonly #direction = injectComponentDirection();
    readonly #editable = computed(() => !this.effectiveDisabled() && !this.readonly());
    readonly #i18n = inject(MonaI18nService);
    readonly #rendered = signal(false);
    readonly #toolbar = new RovingToolbar(() => this.toolbarElement()?.nativeElement);

    /** The last `content` applied, so a binding that echoes the editor's own output isn't applied again. */
    #appliedContent: string | JSONContent | undefined = undefined;

    /** The last value the editor emitted or was given, so a value echoed back isn't applied again. */
    #lastValue: string | null = null;

    /** Set by Escape in the content: the next Tab leaves the editor instead of nesting a list item. */
    #tabLeaves = false;
    protected readonly baseClass = computed(() => {
        const userClass = this.userClass();
        const variantClass = editorBaseThemeVariants();
        return twMerge(variantClass, userClass);
    });
    protected readonly containerClass = computed(() => {
        return editorContainerThemeVariants({ disabled: this.effectiveDisabled() });
    });
    protected readonly editorContainer = viewChild.required<ElementRef<HTMLDivElement>>("editorContainer");
    protected readonly editorService = inject(EditorService);
    protected readonly effectiveDisabled = injectEffectiveDisabled(() => this.disabled());
    protected readonly invalidState = computed(
        () => this.touched() && (this.invalid() || (this.required() && !this.value()))
    );
    protected readonly messages = this.#i18n.componentMessages("editor", EDITOR_DEFAULT_MESSAGES);
    protected readonly placeholderClass = computed(() => editorPlaceholderThemeVariants());
    protected readonly toolbarClass = computed(() => {
        return editorToolbarThemeVariants({ disabled: this.effectiveDisabled() });
    });
    protected readonly toolbarElement = viewChild<ElementRef<HTMLDivElement>>("toolbar");

    /**
     * @description The id of an element that describes the content, such as a hint or an error message.
     */
    public readonly ariaDescribedBy = input("", { alias: "aria-describedby" });

    /**
     * @description The accessible name of the content. Without it or `aria-labelledby`, the content is named "Rich
     * text editor" (translated).
     */
    public readonly ariaLabel = input("", { alias: "aria-label" });

    /**
     * @description The id of a visible label for the content, such as a `<label>` next to the editor.
     */
    public readonly ariaLabelledBy = input("", { alias: "aria-labelledby" });

    /**
     * @description Emits when the editor loses focus.
     * @deprecated Use `editorBlur`.
     */
    // eslint-disable-next-line @angular-eslint/no-output-native -- Kept for compatibility; `editorBlur` replaces it.
    public readonly blur = output();

    /**
     * @description The initial content of the editor, as HTML or a {@link JSONContent} document. A later change
     * replaces the document, unless it is the content the editor already has.
     * @deprecated Use `value` (HTML), or `[formField]` with a signal form. To read the JSON, use the `update` event or
     * the `json` property.
     */
    public readonly content = input<string | JSONContent>();

    /**
     * @description Emits when the editor is created and ready to be used, and again when it is rebuilt for new
     * `settings`.
     */
    public readonly create = output();

    /**
     * @description Disables the editor: the content can't be edited or focused for editing, and the toolbar is inert.
     * When bound to a signal form field via `[formField]`, the form sets it.
     */
    public readonly disabled = input(false, { transform: booleanAttribute });

    /**
     * @description Emits when the editor loses focus.
     */
    public readonly editorBlur = output();

    /**
     * @description Emits when the editor gains focus.
     */
    public readonly editorFocus = output();

    /**
     * @description Marks the editor as invalid once it has been touched. When bound to a signal form field via
     * `[formField]`, the form sets it.
     */
    public readonly invalid = input(false, { transform: booleanAttribute });

    /**
     * @description Text shown in the empty editor, and given to assistive technology as `aria-placeholder`. It is not
     * a name: use a label or `aria-label` too.
     */
    public readonly placeholder = input("");

    /**
     * @description Makes the content read-only and hides the toolbar. When bound to a signal form field via
     * `[formField]`, the form sets it.
     */
    public readonly readonly = input(false, { transform: booleanAttribute });

    /**
     * @description Marks the editor as required: once touched, an empty editor is invalid.
     */
    public readonly required = input(false, { transform: booleanAttribute });

    /**
     * @description Emits when the selection of the editor changes.
     */
    public readonly selectionUpdate = output();

    /**
     * @description The settings of the editor. Changing them rebuilds the editor and keeps its document.
     */
    public readonly settings = input<Partial<EditorSettings>>({});

    /**
     * @description Emits when the editor loses focus.
     * Form directives (`[formField]`, `ngModel`, `formControl`) listen to this to mark the field as touched.
     */
    public readonly touch = output<void>();

    /**
     * @description Sets the touched state. When bound to a signal form field via `[formField]`, the form sets it.
     */
    public readonly touched = input(false, { transform: booleanAttribute });

    /**
     * @description Emits when the user changes the content. It isn't emitted when `value` or `content` is set from
     * outside.
     */
    public readonly update = output<ContentChangeEvent>();

    public readonly userClass = input<string>("", { alias: "class" });

    /**
     * @description The content of the editor as HTML. An empty editor has the value `""`. Use `[(value)]`, or
     * `[formField]` with a signal form.
     */
    public readonly value = model("");

    public constructor() {
        afterNextRender({
            write: () => {
                this.#listenForEscapeThenTab();
                this.#rendered.set(true);
            }
        });
        // Every render: toolbar controls that settings or state add later join its single Tab stop.
        afterEveryRender({
            write: () => this.#toolbar.sync()
        });
        effect(() => {
            const settings = this.settings();
            if (!this.#rendered()) {
                return;
            }
            untracked(() => this.#setupEditor(settings));
        });
        effect(() => {
            const value = this.value();
            if (!this.editorService.ready()) {
                return;
            }
            untracked(() => this.#applyValue(value));
        });
        effect(() => {
            const content = this.content();
            if (!this.editorService.ready()) {
                return;
            }
            untracked(() => this.#applyContent(content));
        });
        effect(() => {
            const editable = this.#editable();
            const attributes = this.#contentAttributes();
            if (!this.editorService.ready()) {
                return;
            }
            untracked(() => this.editorService.setEditable(editable, attributes));
        });
        this.#subscribe();
        this.#destroyRef.onDestroy(() => this.editorService.destroy());
    }

    /**
     * Returns the HTML content of the editor, or `""` before the editor is created.
     * It can be used to save the content of the editor in a database and restore it later.
     */
    public get html(): string {
        return this.editorService.ready() ? this.editorService.editor.getHTML() : "";
    }

    /**
     * Returns the JSON content of the editor in the {@link JSONContent} format, or an empty document before the editor
     * is created.
     * It can be used to save the content of the editor in a database and restore it later.
     */
    public get json(): JSONContent {
        return this.editorService.ready() ? this.editorService.editor.getJSON() : EMPTY_DOCUMENT;
    }

    /**
     * Moves focus into the editor, keeping the selection it had.
     */
    public focus(options?: FocusOptions): void {
        if (this.editorService.ready()) {
            this.editorService.editor.commands.focus(null, { scrollIntoView: !options?.preventScroll });
        }
    }

    protected onToolbarFocusIn(event: FocusEvent): void {
        this.#toolbar.onFocusIn(event);
    }

    protected onToolbarKeydown(event: KeyboardEvent): void {
        this.#toolbar.onKeydown(event);
    }

    #applyContent(content: string | JSONContent | undefined): void {
        if (content === this.#appliedContent) {
            return;
        }
        this.#appliedContent = content;
        if (content === undefined || this.#hasContent(content)) {
            return;
        }
        this.editorService.setContent(content);
    }

    #applyValue(value: string): void {
        if (value === this.#lastValue) {
            return;
        }
        this.#lastValue = value;
        if (value === this.#currentValue()) {
            return;
        }
        this.editorService.setContent(value);
    }

    #currentValue(): string {
        const editor = this.editorService.editor;
        return editor.isEmpty ? "" : editor.getHTML();
    }

    #hasContent(content: string | JSONContent): boolean {
        const editor = this.editorService.editor;
        if (typeof content === "string") {
            return content === editor.getHTML() || content === this.#currentValue();
        }
        return JSON.stringify(content) === JSON.stringify(editor.getJSON());
    }

    /**
     * Tab inside a list nests the item, so the keyboard could be stuck in a long list. Escape, then Tab, leaves the
     * editor: the Tab is kept from ProseMirror and the browser moves focus.
     */
    #listenForEscapeThenTab(): void {
        const container = this.editorContainer().nativeElement;
        const listener = (event: KeyboardEvent): void => {
            if (event.key === "Escape") {
                this.#tabLeaves = true;
                return;
            }
            if (event.key === "Tab" && this.#tabLeaves) {
                event.stopPropagation();
            }
            if (event.key !== "Shift") {
                this.#tabLeaves = false;
            }
        };
        container.addEventListener("keydown", listener, { capture: true });
        this.#destroyRef.onDestroy(() => container.removeEventListener("keydown", listener, { capture: true }));
    }

    #setupEditor(settings: Partial<EditorSettings>): void {
        const value = this.value();
        const content = this.content();
        this.#lastValue = value;
        this.#appliedContent = content;
        this.editorService.setupEditor(this.editorContainer().nativeElement, settings, {
            attributes: this.#contentAttributes(),
            content: value || (content ?? ""),
            editable: this.#editable()
        });
    }

    #subscribe(): void {
        this.editorService.blur$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
            this.touch.emit();
            this.editorBlur.emit();
            this.blur.emit();
        });
        this.editorService.create$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
            this.create.emit();
        });
        this.editorService.focus$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
            this.editorFocus.emit();
        });
        this.editorService.selectionUpdate$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
            this.selectionUpdate.emit();
        });
        this.editorService.update$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
            const value = this.#currentValue();
            this.#lastValue = value;
            this.value.set(value);
            this.update.emit({
                html: this.html,
                json: this.json
            });
        });
    }
}
