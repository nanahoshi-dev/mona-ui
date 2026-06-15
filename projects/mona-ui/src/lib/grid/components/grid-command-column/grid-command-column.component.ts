import {
    ChangeDetectionStrategy,
    Component,
    contentChild,
    computed,
    forwardRef,
    input,
    TemplateRef
} from "@angular/core";
import { v4 } from "uuid";
import { GridCellTemplateDirective } from "../../directives/grid-cell-template.directive";
import { Column } from "../../models/Column";
import { GRID_COLUMN_DEFINITION, GridColumnDefinition } from "../../models/GridColumnDefinition";
import type { GridColumnLockedPosition } from "../../models/GridColumnLockedPosition";

@Component({
    selector: "mona-grid-command-column",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{ provide: GRID_COLUMN_DEFINITION, useExisting: forwardRef(() => GridCommandColumnComponent) }]
})
export class GridCommandColumnComponent implements GridColumnDefinition {
    readonly #column = computed<Column>(() => {
        const stateKey = this.stateKey();
        return {
            aggregate: null,
            calculatedWidth: null,
            cellTemplate: null,
            columnSortDirection: null,
            commandTemplate: this.commandTemplate() ?? null,
            configuredHidden: this.hidden(),
            dataType: "string",
            editTemplate: null,
            editable: false,
            field: stateKey ?? "commands",
            filtered: false,
            footerTemplate: null,
            format: null,
            groupFooterTemplate: null,
            groupSortDirection: null,
            headerTemplate: null,
            hidden: this.hidden(),
            id: this.#columnId,
            index: 0,
            kind: "command",
            locked: this.locked(),
            lockedPosition: this.lockedPosition(),
            maxWidth: this.maxWidth(),
            minWidth: this.minWidth(),
            removeConfirmation: this.removeConfirmation(),
            sortIndex: null,
            stateKey,
            title: this.title(),
            titleTemplate: null,
            width: this.width()
        };
    });
    readonly #columnId = v4();
    private readonly commandTemplate = contentChild(GridCellTemplateDirective, { read: TemplateRef });

    /**
     * @description Whether this command column is hidden from the rendered grid.
     */
    public readonly hidden = input(false);

    /**
     * @description Whether this command column remains fixed while the grid scrolls horizontally.
     */
    public readonly locked = input(false);

    /**
     * @description The side of the grid where this locked command column is fixed.
     */
    public readonly lockedPosition = input<GridColumnLockedPosition>("left");

    /**
     * @description The maximum width of this command column in pixels.
     */
    public readonly maxWidth = input<number | null>(null);

    /**
     * @description The minimum width of this command column in pixels.
     */
    public readonly minWidth = input<number | null>(null);

    /**
     * @description Whether the built-in remove command asks for confirmation before emitting remove.
     */
    public readonly removeConfirmation = input(false);

    /**
     * @description A stable key used to persist state for this command column.
     */
    public readonly stateKey = input<string | null>("commands");

    /**
     * @description The title displayed in the command column header.
     */
    public readonly title = input<string>("Commands");

    /**
     * @description The fixed width of this command column in pixels.
     */
    public readonly width = input<number | null>(160);

    public getColumn(): Column {
        return this.#column();
    }
}
