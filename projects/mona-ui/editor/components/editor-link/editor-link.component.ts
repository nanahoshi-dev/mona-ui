import { Component, computed, inject } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { ButtonGroupComponent } from "@nanahoshi/mona-ui/button-group";
import { DialogService } from "@nanahoshi/mona-ui/dialog";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { EDITOR_DEFAULT_MESSAGES } from "../../i18n/editor.default-messages";
import { EditorService } from "../../services/editor.service";

@Component({
    selector: "mona-editor-link",
    imports: [ButtonGroupComponent, ButtonDirective],
    templateUrl: "./editor-link.component.html"
})
export class EditorLinkComponent {
    readonly #dialogService: DialogService = inject(DialogService);
    readonly #editorService: EditorService = inject(EditorService);
    readonly #i18n = inject(MonaI18nService);
    protected readonly messages = this.#i18n.componentMessages("editor", EDITOR_DEFAULT_MESSAGES);
    protected readonly linkSelected = computed(() => {
        this.#editorService.state();
        return this.#editorService.editor.isActive("link");
    });
    protected readonly unlinkDisabled = computed(() => {
        this.#editorService.state();
        return !this.#editorService.editor.isActive("link");
    });

    public onLinkDialogDisplay(): void {
        const link = this.#editorService.editor.getAttributes("link")["href"] ?? "";
        const dialogRef = this.#dialogService.show({
            title: this.messages().insertLink,
            type: "info",
            // inputType: "string",
            text: "Enter the URL"
            // value: link
        });
        // dialogRef.result.pipe(take(1)).subscribe(result => this.setLink(result.value as string));
    }

    public onUnlinkClick(): void {
        this.#editorService.editor.chain().focus().unsetLink().run();
    }

    private setLink(url: string): void {
        if (!url) {
            this.#editorService.editor.chain().focus().unsetLink().run();
            return;
        }
        this.#editorService.editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
}
