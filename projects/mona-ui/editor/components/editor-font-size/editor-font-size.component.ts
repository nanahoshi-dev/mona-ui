import { Component, computed, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DropdownListComponent } from "@nanahoshi/mona-ui/dropdown-list";
import { EditorService } from "../../services/editor.service";
import { editorFontSizeDropdownListThemeVariants } from "../../styles/editor.styles";

@Component({
    selector: "mona-editor-font-size",
    imports: [DropdownListComponent, FormsModule],
    templateUrl: "./editor-font-size.component.html"
})
export class EditorFontSizeComponent {
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
