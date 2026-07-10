import { Component, computed, inject } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { ButtonGroupComponent } from "@nanahoshi/mona-ui/button-group";
import { DialogService } from "@nanahoshi/mona-ui/dialog";
import { EditorService } from "../../services/editor.service";

@Component({
    selector: "mona-editor-link",
    imports: [ButtonGroupComponent, ButtonDirective],
    templateUrl: "./editor-link.component.html"
})
export class EditorLinkComponent {
    readonly #dialogService: DialogService = inject(DialogService);
    readonly #editorService: EditorService = inject(EditorService);
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
            title: "Insert Link",
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
