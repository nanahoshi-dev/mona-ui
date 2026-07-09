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
import { DataType } from "@nanahoshi/mona-ui/common";
import { GridCellTemplateDirective } from "../../directives/grid-cell-template.directive";
import { GridColumnTitleTemplateDirective } from "../../directives/grid-column-title-template.directive";
import { GridEditTemplateDirective } from "../../directives/grid-edit-template.directive";
import { GridFooterTemplateDirective } from "../../directives/grid-footer-template.directive";
import { GridGroupFooterTemplateDirective } from "../../directives/grid-group-footer-template.directive";
import { GridHeaderTemplateDirective } from "../../directives/grid-header-template.directive";
import type { AggregateFunction } from "../../models/AggregateFunction";
import { Column, type ColumnFormat } from "../../models/Column";
import { GRID_COLUMN_DEFINITION, GridColumnDefinition } from "../../models/GridColumnDefinition";
import type { GridColumnLockedPosition } from "../../models/GridColumnLockedPosition";

@Component({
    selector: "mona-grid-column",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{ provide: GRID_COLUMN_DEFINITION, useExisting: forwardRef(() => GridColumnComponent) }]
})
export class GridColumnComponent implements GridColumnDefinition {
    readonly #columnId = v4();
    readonly #column = computed<Column>(() => ({
        aggregate: this.aggregate(),
        calculatedWidth: null,
        cellTemplate: this.cellTemplate() ?? null,
        columnSortDirection: null,
        commandTemplate: null,
        configuredHidden: this.hidden(),
        dataType: this.type(),
        editTemplate: this.editTemplate() ?? null,
        editable: this.editable(),
        field: this.field(),
        filtered: false,
        footerTemplate: this.footerTemplate() ?? null,
        format: this.format() ?? null,
        groupFooterTemplate: this.groupFooterTemplate() ?? null,
        groupSortDirection: null,
        headerTemplate: this.headerTemplate() ?? null,
        hidden: this.hidden(),
        id: this.#columnId,
        index: 0,
        kind: "data",
        locked: this.locked(),
        lockedPosition: this.lockedPosition(),
        maxWidth: this.maxWidth(),
        minWidth: this.minWidth(),
        removeConfirmation: false,
        sortIndex: null,
        stateKey: this.stateKey(),
        title: this.title(),
        titleTemplate: this.titleTemplate() ?? null,
        width: this.width() ?? null
    }));
    private readonly cellTemplate = contentChild(GridCellTemplateDirective, { read: TemplateRef });
    private readonly editTemplate = contentChild(GridEditTemplateDirective, { read: TemplateRef });
    private readonly footerTemplate = contentChild(GridFooterTemplateDirective, { read: TemplateRef });
    private readonly groupFooterTemplate = contentChild(GridGroupFooterTemplateDirective, { read: TemplateRef });
    private readonly headerTemplate = contentChild(GridHeaderTemplateDirective, { read: TemplateRef });
    private readonly titleTemplate = contentChild(GridColumnTitleTemplateDirective, { read: TemplateRef });
    /**
     * @description The aggregate shown in the grid footer for this column.
     */
    public readonly aggregate = input<AggregateFunction | null>(null);

    /**
     * @description Whether this column is editable when the grid is in edit mode.
     */
    public readonly editable = input<boolean>(true);

    /**
     * @description The field name of the data property to display in this column.
     */
    public readonly field = input<string>("");

    /**
     * @description Formats the displayed cell value. String formats apply to date, datetime, and time columns; formatter functions replace the cell text.
     */
    public readonly format = input<ColumnFormat | null>();

    /**
     * @description Whether this column is hidden from the rendered grid.
     */
    public readonly hidden = input(false);

    /**
     * @description Whether this column remains fixed while the grid scrolls horizontally.
     */
    public readonly locked = input(false);

    /**
     * @description The side of the grid where this locked column is fixed.
     */
    public readonly lockedPosition = input<GridColumnLockedPosition>("left");

    /**
     * @description The maximum width of this column in pixels.
     */
    public readonly maxWidth = input<number | null>(null);

    /**
     * @description The minimum width of this column in pixels.
     */
    public readonly minWidth = input<number>(40);

    /**
     * @description A stable key used to persist state for columns whose field is empty or unstable.
     */
    public readonly stateKey = input<string | null>(null);

    /**
     * @description The title displayed in the column header.
     */
    public readonly title = input<string>("");

    /**
     * @description The data type of the column. Determines the edit component and filter behavior.
     */
    public readonly type = input<DataType>("string");

    /**
     * @description The fixed width of this column in pixels. If not set, the column width is calculated automatically.
     */
    public readonly width = input<number | null>();

    public getColumn(): Column {
        return this.#column();
    }
}
