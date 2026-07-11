import { Component, computed, inject, output } from "@angular/core";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import { EditorTableInsertEvent } from "../../models/EditorTableInsertEvent";
import { EDITOR_STYLE_STRATEGY } from "../../styles/editor.styles";

@Component({
    selector: "mona-editor-table-creator",
    templateUrl: "./editor-table-creator.component.html"
})
export class EditorTableCreatorComponent {
    readonly #styleStrategy = inject(EDITOR_STYLE_STRATEGY);
    readonly #themeService = inject(ThemeService);
    protected highlightedCell: { row: number; col: number } = { row: 0, col: 0 };
    protected readonly tableCreatorCellClass = computed(() => {
        const theme = this.#themeService.theme();
        return this.#styleStrategy.resolve(theme).tableCreatorCell();
    });
    protected readonly tableCreatorClass = computed(() => {
        const theme = this.#themeService.theme();
        return this.#styleStrategy.resolve(theme).tableCreator();
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
