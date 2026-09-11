import { Component, computed, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DropdownListComponent } from "@nanahoshi/mona-ui/dropdown-list";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { EDITOR_DEFAULT_MESSAGES } from "../../i18n/editor.default-messages";
import { EditorService } from "../../services/editor.service";
import { editorFontSizeDropdownListThemeVariants } from "../../styles/editor.styles";

@Component({
    selector: "mona-editor-font-size",
    imports: [DropdownListComponent, FormsModule],
    templateUrl: "./editor-font-size.component.html"
})
export class EditorFontSizeComponent {
    readonly #i18n = inject(MonaI18nService);
    protected readonly messages = this.#i18n.componentMessages("editor", EDITOR_DEFAULT_MESSAGES);
    protected readonly editorService: EditorService = inject(EditorService);
    protected readonly dropdownListClass = computed(() => {
        return editorFontSizeDropdownListThemeVariants();
    });
    protected readonly selectedFontSize = computed(() => {
        this.editorService.state();
        return (
            this.editorService
                .fontSizes()
                .firstOrDefault(fs => this.editorService.editor.isActive("textStyle", { fontSize: fs })) ?? null
        );
    });

    public onFontSizeChange(fontSize: string | null | undefined): void {
        if (!fontSize) {
            return;
        }
        this.editorService.editor.chain().focus().setFontSize(fontSize).run();
    }
}
