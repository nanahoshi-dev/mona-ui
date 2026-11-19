import { DestroyRef, Directive, effect, inject, input, output, untracked } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { GridKeySelector } from "../models/GridKeySelector";
import type { GridTreeChildren } from "../models/GridTreeOptions";
import { GridService } from "../services/grid.service";

/**
 * Shows the grid's rows as a tree: each row can have child rows, shown below it, indented, when it's expanded.
 * Give either `children`, for data items that hold their children, or `parentKey`, for flat data whose items
 * name their parent's `rowKey` value.
 */
@Directive({
    selector: "mona-grid[monaGridTree]",
    exportAs: "monaGridTree"
})
export class GridTreeDirective<T = Record<PropertyKey, unknown>> {
    readonly #destroyRef = inject(DestroyRef);
    readonly #gridService = inject(GridService);

    /**
     * @description The field holding a data item's child items, or a function returning them. Use it when the
     * grid's `data` holds the root items and each item holds its children.
     * @default ""
     */
    public readonly children = input<GridTreeChildren<T> | "">("");

    /**
     * @description The parent key of each data item: the field holding the `rowKey` value of its parent, or a
     * function returning it. Use it when the grid's `data` is flat; the grid needs a `rowKey`. An item whose parent
     * isn't in the data is a root.
     * @default ""
     */
    public readonly parentKey = input<GridKeySelector<T>>("");

    /**
     * @description The keys of the expanded tree rows: their `rowKey` values, or the data items when the grid has
     * no `rowKey`. Rows start collapsed. It's apart from the grid's own `expandedKeys`, which opens detail rows.
     * @default []
     */
    public readonly treeExpandedKeys = input<Iterable<unknown>>([]);

    /**
     * @description Emitted with every expanded tree row's key when the user expands or collapses a row, and when
     * filtering expands the rows above its matches. Not emitted for a `treeExpandedKeys` value set from code.
     */
    public readonly treeExpandedKeysChange = output<unknown[]>();

    public constructor() {
        effect(() => {
            const children = this.children();
            const parentKey = this.parentKey();
            untracked(() =>
                this.#gridService.setTreeOptions({
                    children: (children || null) as GridTreeChildren | null,
                    parentKey: (parentKey || null) as GridKeySelector<unknown>
                })
            );
        });
        effect(() => {
            const keys = this.treeExpandedKeys();
            untracked(() => this.#gridService.loadTreeExpandedKeys(keys));
        });
        // Filtering expands the rows above its matches, so every match is in view.
        effect(() => {
            const ancestors = this.#gridService.treeMatchAncestorUids();
            untracked(() => this.#gridService.expandTreeRows(ancestors));
        });
        this.#gridService.treeExpandedKeysChange$
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(keys => this.treeExpandedKeysChange.emit(keys));
        this.#destroyRef.onDestroy(() => this.#gridService.setTreeOptions(null));
    }

    /** Collapses every row, and emits `treeExpandedKeysChange`. */
    public collapseAll(): void {
        this.#gridService.setAllTreeRowsExpanded(false);
    }

    /** Expands every row that has children, so the whole tree shows, and emits `treeExpandedKeysChange`. */
    public expandAll(): void {
        this.#gridService.setAllTreeRowsExpanded(true);
    }
}
