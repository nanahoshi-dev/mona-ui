import { Component, computed, inject, input, type Signal } from "@angular/core";
import { v4 } from "uuid";
import type { ColumnGroup } from "../../models/ColumnGroup";

/**
 * Puts a header over the `mona-grid-column`s and `mona-grid-command-column`s inside it. Groups nest: each level adds a
 * header row above the column headers.
 */
@Component({
    selector: "mona-grid-column-group",
    template: ""
})
export class GridColumnGroupComponent {
    readonly #id = v4();
    readonly #parent = inject(GridColumnGroupComponent, { optional: true, skipSelf: true });

    /**
     * The groups from the outermost one to this one.
     * @internal
     */
    public readonly path: Signal<readonly ColumnGroup[]> = computed(() => [
        ...(this.#parent?.path() ?? []),
        { id: this.#id, title: this.title() }
    ]);

    /**
     * @description The text shown in the group's header, which also names it for assistive technologies.
     */
    public readonly title = input<string>("");
}
