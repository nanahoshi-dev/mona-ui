import { Component, computed, ElementRef, inject, output, signal } from "@angular/core";
import { injectComponentDirection, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { EDITOR_DEFAULT_MESSAGES } from "../../i18n/editor.default-messages";
import type { EditorTableInsertEvent } from "../../models/EditorTableInsertEvent";
import { editorTableCreatorCellThemeVariants, editorTableCreatorThemeVariants } from "../../styles/editor.styles";

const SIZE = 8;

interface TableCell {
    readonly col: number;
    readonly row: number;
}

/**
 * The table size picker: an 8 × 8 grid of buttons, one Tab stop. The arrows (mirrored in right-to-left text), Home
 * and End move the size, Enter or Space inserts it, and the size is read out below the grid.
 */
@Component({
    selector: "mona-editor-table-creator",
    templateUrl: "./editor-table-creator.component.html"
})
export class EditorTableCreatorComponent {
    readonly #direction = injectComponentDirection();
    readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #i18n = inject(MonaI18nService);
    protected readonly cells: readonly TableCell[] = Array.from({ length: SIZE * SIZE }, (_, index) => ({
        col: (index % SIZE) + 1,
        row: Math.floor(index / SIZE) + 1
    }));
    protected readonly highlighted = signal<TableCell>({ col: 1, row: 1 });
    protected readonly messages = this.#i18n.componentMessages("editor", EDITOR_DEFAULT_MESSAGES);
    protected readonly tableCreatorCellClass = computed(() => {
        return editorTableCreatorCellThemeVariants();
    });
    protected readonly tableCreatorClass = computed(() => {
        return editorTableCreatorThemeVariants();
    });
    public readonly insert = output<EditorTableInsertEvent>();

    protected isHighlighted(cell: TableCell): boolean {
        const highlighted = this.highlighted();
        return cell.row <= highlighted.row && cell.col <= highlighted.col;
    }

    protected isTabStop(cell: TableCell): boolean {
        const highlighted = this.highlighted();
        return cell.row === highlighted.row && cell.col === highlighted.col;
    }

    protected onCellClick(cell: TableCell): void {
        this.insert.emit({ col: cell.col, row: cell.row });
    }

    protected onCellFocus(cell: TableCell): void {
        this.highlighted.set(cell);
    }

    protected onCellPointerEnter(cell: TableCell): void {
        this.highlighted.set(cell);
    }

    protected onKeydown(event: KeyboardEvent): void {
        const { col, row } = this.highlighted();
        const forward = this.#direction() === "rtl" ? -1 : 1;
        let next: TableCell;
        switch (event.key) {
            case "ArrowDown":
                next = { col, row: row + 1 };
                break;
            case "ArrowUp":
                next = { col, row: row - 1 };
                break;
            case "ArrowRight":
                next = { col: col + forward, row };
                break;
            case "ArrowLeft":
                next = { col: col - forward, row };
                break;
            case "Home":
                next = { col: 1, row: event.ctrlKey ? 1 : row };
                break;
            case "End":
                next = { col: SIZE, row: event.ctrlKey ? SIZE : row };
                break;
            default:
                return;
        }
        event.preventDefault();
        const clamped = {
            col: Math.min(Math.max(next.col, 1), SIZE),
            row: Math.min(Math.max(next.row, 1), SIZE)
        };
        this.highlighted.set(clamped);
        const index = (clamped.row - 1) * SIZE + (clamped.col - 1);
        this.#host.nativeElement.querySelectorAll<HTMLButtonElement>("button").item(index)?.focus();
    }
}
