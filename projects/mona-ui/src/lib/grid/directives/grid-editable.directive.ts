import { Directive, effect, inject, input, untracked } from "@angular/core";
import { EditableOptions } from "../models/EditableOptions";
import { GridKeySelector } from "../models/GridKeySelector";
import { GridService } from "../services/grid.service";

@Directive({
    selector: "[monaGridEditable]"
})
export class GridEditableDirective {
    readonly #gridService: GridService = inject(GridService);
    public readonly options = input<EditableOptions | "">("", {
        alias: "monaGridEditable"
    });
    /**
     * @description Field name or selector used to keep edited row identity stable when data is rebound.
     */
    public readonly rowKey = input<GridKeySelector<unknown> | null>(null);

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
    }
}
