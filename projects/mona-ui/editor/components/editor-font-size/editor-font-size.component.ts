import { Component, computed, inject, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DropdownListComponent } from "@mirei/mona-ui/dropdown-list";
import { EditorService } from "../../services/editor.service";

@Component({
    selector: "mona-editor-font-size",
    imports: [DropdownListComponent, FormsModule],
    templateUrl: "./editor-font-size.component.html",
    styleUrl: "./editor-font-size.component.scss"
})
export class EditorFontSizeComponent implements OnInit {
    protected readonly editorService: EditorService = inject(EditorService);
    protected readonly selectedFontSize = computed(() => {
        this.editorService.state();
        return (
            this.editorService
                .fontSizes()
                .firstOrDefault(fs => this.editorService.editor.isActive("textStyle", { fontSize: fs })) ?? null
        );
    });

    public ngOnInit(): void {
        // this.#editorService.editor.chain().focus().setFontSize(this.selectedFontSize().value).run();
    }

    public onFontSizeChange(fontSize: string): void {
        this.editorService.editor.chain().focus().setFontSize(fontSize).run();
    }
}
