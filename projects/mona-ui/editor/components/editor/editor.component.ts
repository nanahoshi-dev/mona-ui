import {
    afterNextRender,
    Component,
    computed,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    input,
    output,
    untracked,
    viewChild
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import { JSONContent } from "@tiptap/core";
import { twMerge } from "tailwind-merge";
import { ContentChangeEvent } from "../../models/ContentChangeEvent";
import { EditorSettings } from "../../models/EditorSettings";
import { EditorService } from "../../services/editor.service";
import { EDITOR_STYLE_STRATEGY } from "../../styles/editor.styles";
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

@Component({
    selector: "mona-editor",
    imports: [
        FormsModule,
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
        "[class]": "baseClass()"
    }
})
export class EditorComponent {
    readonly #destroyRef = inject(DestroyRef);
    readonly #styleStrategy = inject(EDITOR_STYLE_STRATEGY);
    readonly #themeService = inject(ThemeService);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const userClass = this.userClass();
        const variantClass = this.#styleStrategy.resolve(theme).base();
        return twMerge(variantClass, userClass);
    });
    protected readonly containerClass = computed(() => {
        const theme = this.#themeService.theme();
        return this.#styleStrategy.resolve(theme).container();
    });
    protected readonly editorContainer = viewChild.required<ElementRef<HTMLDivElement>>("editorContainer");
    protected readonly editorService = inject(EditorService);
    protected readonly toolbarClass = computed(() => {
        const theme = this.#themeService.theme();
        return this.#styleStrategy.resolve(theme).toolbar();
    });

    /**
     * @description Emits when the editor loses focus.
     */
    public readonly blur = output();

    /**
     * @description Emits when the editor is created for the first time and is ready to be used.
     */
    public readonly create = output();

    /**
     * @description Emits when the editor gains focus.
     */
    public readonly focus = output();

    /**
     * @description Emits when the selection of the editor changes.
     */
    public readonly selectionUpdate = output();

    /**
     * @description Emits when the content of the editor changes.
     */
    public readonly update = output<ContentChangeEvent>();

    /**
     * @description The initial content of the editor.
     */
    public readonly content = input<string | JSONContent>();

    /**
     * @description The settings of the editor.
     */
    public readonly settings = input<Partial<EditorSettings>>({});

    public readonly userClass = input<string>("", { alias: "class" });

    public constructor() {
        effect(() => {
            const settings = this.settings();
            untracked(() => {
                this.editorService.setupEditor(this.editorContainer().nativeElement, settings);
            });
        });
        effect(() => {
            const content = this.content() ?? "";
            untracked(() => {
                this.loadEditorContent(content);
            });
        });
        afterNextRender({
            read: () => this.setSubscriptions()
        });
        this.#destroyRef.onDestroy(() => this.editorService.destroy());
    }

    private loadEditorContent(content: string | JSONContent): void {
        if (typeof content === "string") {
            this.editorService.editor.commands.setContent(content);
        } else {
            this.editorService.editor.commands.setContent({
                type: "doc",
                content: [content]
            });
        }
    }

    private setSubscriptions(): void {
        this.editorService.blur$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
            this.blur.emit();
        });
        this.editorService.create$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
            this.create.emit();
        });
        this.editorService.focus$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
            this.focus.emit();
        });
        this.editorService.selectionUpdate$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
            this.selectionUpdate.emit();
        });
        this.editorService.update$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
            this.update.emit({
                html: this.html,
                json: this.json
            });
        });
    }

    /**
     * Returns the HTML content of the editor.
     * It can be used to save the content of the editor in a database and restore it later.
     */
    public get html(): string {
        return this.editorService.editor.getHTML();
    }

    /**
     * Returns the JSON content of the editor in the {@link JSONContent} format.
     * It can be used to save the content of the editor in a database and restore it later.
     */
    public get json(): JSONContent {
        return this.editorService.editor.getJSON();
    }
}
