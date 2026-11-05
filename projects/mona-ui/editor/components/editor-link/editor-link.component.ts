import { Component, computed, inject, Injector } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { ButtonGroupComponent } from "@nanahoshi/mona-ui/button-group";
import { type DialogAction, DialogService } from "@nanahoshi/mona-ui/dialog";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { EDITOR_DEFAULT_MESSAGES } from "../../i18n/editor.default-messages";
import { EditorService } from "../../services/editor.service";
import {
    type EditorLinkDialogData,
    EditorLinkDialogComponent
} from "../editor-link-dialog/editor-link-dialog.component";

type LinkDialogAction = "apply" | "cancel" | "remove";

@Component({
    selector: "mona-editor-link",
    imports: [ButtonGroupComponent, ButtonDirective],
    templateUrl: "./editor-link.component.html"
})
export class EditorLinkComponent {
    readonly #dialogService: DialogService = inject(DialogService);
    readonly #editorService: EditorService = inject(EditorService);
    readonly #i18n = inject(MonaI18nService);
    readonly #injector = inject(Injector);
    protected readonly linkSelected = computed(() => {
        this.#editorService.state();
        return this.#editorService.editor.isActive("link");
    });
    protected readonly messages = this.#i18n.componentMessages("editor", EDITOR_DEFAULT_MESSAGES);
    protected readonly unlinkDisabled = computed(() => !this.linkSelected());

    /**
     * Opens the link dialog for the selection: Apply sets the link (extending it over the whole link when the
     * selection is inside one), Remove takes it off, Cancel and Escape change nothing.
     */
    public onLinkDialogDisplay(): void {
        const editor = this.#editorService.editor;
        const editing = editor.isActive("link");
        const href = (editor.getAttributes("link")["href"] as string | undefined) ?? "";
        const messages = this.messages();
        const actions: DialogAction<LinkDialogAction>[] = [{ data: "cancel", text: messages.cancel }];
        if (editing) {
            actions.push({ data: "remove", text: messages.removeLink });
        }
        actions.push({ data: "apply", default: true, look: "primary", text: messages.apply });

        const dialogRef = this.#dialogService.show<never, EditorLinkDialogData>({
            actions,
            content: EditorLinkDialogComponent,
            data: { href },
            focusedElement: "mona-editor-link-dialog input",
            injector: this.#injector,
            title: editing ? messages.editLink : messages.insertLink,
            width: 420
        });
        let url: string | null = null;
        dialogRef.action$.subscribe(event => {
            if (event.action.data !== "apply") {
                return;
            }
            url = (dialogRef.component?.instance as EditorLinkDialogComponent | undefined)?.validate() ?? null;
            if (url === null) {
                event.preventDefault();
            }
        });
        dialogRef.result.subscribe(result => {
            if (result.viaClose) {
                return;
            }
            if (result.action.data === "remove") {
                this.#editorService.editor.chain().focus().extendMarkRange("link").unsetLink().run();
            } else if (result.action.data === "apply" && url !== null) {
                this.#setLink(url, editing);
            }
        });
    }

    public onUnlinkClick(): void {
        this.#editorService.editor.chain().focus().extendMarkRange("link").unsetLink().run();
    }

    /**
     * Links the selection, or the whole link the cursor is in. With nothing selected outside a link, the URL itself
     * is inserted as the link's text.
     */
    #setLink(href: string, editing: boolean): void {
        const editor = this.#editorService.editor;
        if (!editing && editor.state.selection.empty) {
            editor
                .chain()
                .focus()
                .insertContent({ marks: [{ attrs: { href }, type: "link" }], text: href, type: "text" })
                .run();
            return;
        }
        editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    }
}
