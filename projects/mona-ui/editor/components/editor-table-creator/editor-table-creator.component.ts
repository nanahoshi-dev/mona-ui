import { Component, computed, inject, output } from "@angular/core";
import { EditorTableInsertEvent } from "../../models/EditorTableInsertEvent";
import { editorTableCreatorCellThemeVariants, editorTableCreatorThemeVariants } from "../../styles/editor.styles";

@Component({
    selector: "mona-editor-table-creator",
    templateUrl: "./editor-table-creator.component.html"
})
export class EditorTableCreatorComponent {
    protected highlightedCell: { row: number; col: number } = { row: 0, col: 0 };
    protected readonly tableCreatorCellClass = computed(() => {
        return editorTableCreatorCellThemeVariants();
    });
    protected readonly tableCreatorClass = computed(() => {
        return editorTableCreatorThemeVariants();
    });
    public readonly insert = output<EditorTableInsertEvent>();

    public onCellClick(row: number, col: number): void {
        this.insert.emit({ row, col });
        this.highlightedCell = { row: 0, col: 0 };
    }

    public onCellMouseEnter(row: number, col: number): void {
        this.highlightedCell = { row, col };
    }

    public onCellMouseLeave(): void {
        this.highlightedCell = { row: 0, col: 0 };
    }
}
