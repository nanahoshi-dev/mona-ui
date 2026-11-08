import { afterNextRender, DestroyRef, Directive, effect, inject, input, output, untracked } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { CellEditEvent } from "../models/CellEditEvent";
import { EditableOptions } from "../models/EditableOptions";
import { GridAddEvent } from "../models/GridAddEvent";
import { GridCancelEvent } from "../models/GridCancelEvent";
import type { GridEditEvent } from "../models/GridEditEvent";
import { GridRemoveEvent } from "../models/GridRemoveEvent";
import { GridSaveEvent } from "../models/GridSaveEvent";
import { RowEditEvent } from "../models/RowEditEvent";
import { GridService } from "../services/grid.service";

@Directive({
    selector: "mona-grid[monaGridEditable]"
})
/** Generic over the row type, which a typed `schema` or `newRowFactory` sets. */
export class GridEditableDirective<T extends object = Record<PropertyKey, unknown>> {
    readonly #destroyRef = inject(DestroyRef);
    readonly #gridService: GridService = inject(GridService);

    /**
     * @description Emitted before the grid displays the new-row editor.
     */
    public readonly add = output<GridAddEvent>();

    /**
     * @description Emitted before an edit operation is canceled; `reason` says why. Prevent it to keep editing,
     * except for `"removed"`, when the edited row left the data or the view.
     */
    // The public name matches the other edit events (add, save, remove); renaming it would break bindings.
    // eslint-disable-next-line @angular-eslint/no-output-native
    public readonly cancel = output<GridCancelEvent>();

    /**
     * @description Emitted before a changed cell is saved in cell mode; not when the value didn't change.
     * `rowData` is the row as it was; persist from `save`, whose `rowData` holds the edited values.
     */
    public readonly cellEdit = output<CellEditEvent>();

    /**
     * @description Emitted before a row enters edit mode.
     */
    public readonly edit = output<GridEditEvent>();

    /**
     * @description Creates the initial data object used by the add-row editor.
     */
    public readonly newRowFactory = input<() => T>(() => ({}) as T);

    /**
     * @description Enables inline editing. An empty string enables cell-mode editing with default settings; pass an
     * object to choose `"cell"` or `"row"` mode and an optional validation `schema`.
     */
    public readonly options = input<EditableOptions<T> | "">("", {
        alias: "monaGridEditable"
    });

    /**
     * @description Emitted when a row remove command is triggered, with the row's `key` and `index`.
     */
    public readonly remove = output<GridRemoveEvent>();

    /**
     * @description Emitted after a changed row is saved (row mode only).
     */
    public readonly rowEdit = output<RowEditEvent>();
    /**
     * @description Emitted before an edited or new row is saved; not when an edit changed nothing. `rowData`
     * holds the edited values and `originalRowData` the row as it was. Prevent it to keep the editor open,
     * for example while saving on the server, then call `endEdit()`.
     */
    public readonly save = output<GridSaveEvent<T>>();

    public constructor() {
        effect(() => {
            const options = this.options();
            untracked(() => {
                if (options) {
                    // The grid keeps rows untyped. The row type only checks the consumer's own schema.
                    this.#gridService.setEditableOptions(options as unknown as EditableOptions);
                } else if (options === "") {
                    this.#gridService.setEditableOptions({ enabled: true, mode: "cell" });
                }
            });
        });
        effect(() => {
            const factory = this.newRowFactory();
            untracked(() => this.#gridService.setNewRowFactory(factory as () => Record<PropertyKey, unknown>));
        });
        afterNextRender({
            read: () => this.#setSubscriptions()
        });
    }

    /**
     * Closes the current edit without reporting it, such as after a `save` that was prevented to save on the
     * server has finished.
     */
    public endEdit(): void {
        this.#gridService.endEdit();
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
        this.#gridService.save$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => this.save.emit(event as unknown as GridSaveEvent<T>));
    }
}
