import { Component, computed, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DropdownListComponent } from "@nanahoshi/mona-ui/dropdown-list";
import { DropdownItemTemplateDirective } from "@nanahoshi/mona-ui/dropdowns";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { EDITOR_DEFAULT_MESSAGES } from "../../i18n/editor.default-messages";
import { EditorService } from "../../services/editor.service";
import { editorFontFamilyDropdownListThemeVariants } from "../../styles/editor.styles";

@Component({
    selector: "mona-editor-font-family",
    imports: [DropdownListComponent, FormsModule, DropdownItemTemplateDirective],
    templateUrl: "./editor-font-family.component.html"
})
export class EditorFontFamilyComponent {
    readonly #i18n = inject(MonaI18nService);
    protected readonly messages = this.#i18n.componentMessages("editor", EDITOR_DEFAULT_MESSAGES);
    protected readonly dropdownListClass = computed(() => {
        return editorFontFamilyDropdownListThemeVariants();
    });
    protected readonly editorService: EditorService = inject(EditorService);
    protected readonly selectedFontFamily = computed(() => {
        this.editorService.state();
        return (
            this.editorService
                .fonts()
                .firstOrDefault(ff => this.editorService.editor.isActive("textStyle", { fontFamily: ff })) ?? null
        );
    });

    public onFontFamilyChange(fontFamily: string | null | undefined): void {
        if (!fontFamily) {
            return;
        }
        this.editorService.editor.chain().focus().setFontFamily(fontFamily).run();
    }
}
