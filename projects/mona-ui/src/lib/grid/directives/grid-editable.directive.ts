import { afterNextRender, DestroyRef, Directive, effect, inject, input, output, untracked } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { CellEditEvent } from "../models/CellEditEvent";
import { EditableOptions } from "../models/EditableOptions";
import { GridAddEvent } from "../models/GridAddEvent";
import { GridCancelEvent } from "../models/GridCancelEvent";
import type { GridEditEvent } from "../models/GridEditEvent";
import { GridKeySelector } from "../models/GridKeySelector";
import { GridRemoveEvent } from "../models/GridRemoveEvent";
import { GridSaveEvent } from "../models/GridSaveEvent";
import { RowEditEvent } from "../models/RowEditEvent";
import { GridService } from "../services/grid.service";

@Directive({
    selector: "mona-grid[monaGridEditable]"
})
export class GridEditableDirective {
    readonly #destroyRef = inject(DestroyRef);
    readonly #gridService: GridService = inject(GridService);

    /**
     * @description Emitted before the grid displays the new-row editor.
     */
    public readonly add = output<GridAddEvent>();

    /**
     * @description Emitted before an edit operation is canceled.
     */
    public readonly cancel = output<GridCancelEvent>();

    /**
     * @description Emitted when a cell is edited.
     */
    public readonly cellEdit = output<CellEditEvent>();

    /**
     * @description Emitted before a row enters edit mode.
     */
    public readonly edit = output<GridEditEvent>();

    /**
     * @description Creates the initial data object used by the add-row editor.
     */
    public readonly newRowFactory = input<() => Record<PropertyKey, unknown>>(() => ({}));

    public readonly options = input<EditableOptions | "">("", {
        alias: "monaGridEditable"
    });

    /**
     * @description Emitted when a row remove command is triggered.
     */
    public readonly remove = output<GridRemoveEvent>();

    /**
     * @description Emitted when a row edit is committed (row mode only).
     */
    public readonly rowEdit = output<RowEditEvent>();
    /**
     * @description Field name or selector used to keep edited row identity stable when data is rebound.
     */
    public readonly rowKey = input<GridKeySelector<unknown> | null>(null);
    /**
     * @description Emitted before an edited or new row is saved.
     */
    public readonly save = output<GridSaveEvent>();

    public constructor() {
        effect(() => {
            const options = this.options();
            untracked(() => {
                if (options) {
                    this.#gridService.setEditableOptions(options);
                } else if (options === "") {
                    this.#gridService.setEditableOptions({ enabled: true, mode: "cell" });
                }
            });
        });
        effect(() => {
            const rowKey = this.rowKey();
            untracked(() => this.#gridService.editableRowKey.set(rowKey));
        });
        effect(() => {
            const factory = this.newRowFactory();
            untracked(() => this.#gridService.setNewRowFactory(factory));
        });
        afterNextRender({
            read: () => this.#setSubscriptions()
        });
    }

    #setSubscriptions(): void {
        this.#gridService.add$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => this.add.emit(event));
        this.#gridService.cancel$
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(event => this.cancel.emit(event));
        this.#gridService.cellEdit$
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe((event: CellEditEvent) => this.cellEdit.emit(event));
        this.#gridService.edit$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => this.edit.emit(event));
        this.#gridService.remove$
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(event => this.remove.emit(event));
        this.#gridService.rowEdit$
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe((event: RowEditEvent) => this.rowEdit.emit(event));
        this.#gridService.save$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => this.save.emit(event));
    }
}
