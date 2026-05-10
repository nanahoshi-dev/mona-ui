import { ChangeDetectionStrategy, Component, contentChild, effect, input, TemplateRef, untracked } from "@angular/core";
import { DataType } from "../../../models/DataType";
import { GridCellTemplateDirective } from "../../directives/grid-cell-template.directive";
import { GridColumnTitleTemplateDirective } from "../../directives/grid-column-title-template.directive";
import { Column, ColumnConfig } from "../../models/Column";

@Component({
    selector: "mona-grid-column",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GridColumnComponent {
    private readonly cellTemplate = contentChild(GridCellTemplateDirective, { read: TemplateRef });
    private readonly titleTemplate = contentChild(GridColumnTitleTemplateDirective, { read: TemplateRef });
    public readonly column = new Column();
    /**
     * @description Whether this column is editable when the grid is in edit mode.
     */
    public readonly editable = input<boolean>(true);

    /**
     * @description The field name of the data property to display in this column.
     */
    public readonly field = input<string>("");

    /**
     * @description The maximum width of this column in pixels.
     */
    public readonly maxWidth = input<number | null>(null);

    /**
     * @description The minimum width of this column in pixels.
     */
    public readonly minWidth = input<number>(40);

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

    public constructor() {
        effect(() => {
            const config: ColumnConfig = {
                cellTemplate: this.cellTemplate() ?? null,
                dataType: this.type(),
                editable: this.editable(),
                field: this.field(),
                maxWidth: this.maxWidth(),
                minWidth: this.minWidth(),
                title: this.title(),
                titleTemplate: this.titleTemplate() ?? null,
                width: this.width() ?? null
            };
            untracked(() => this.column.setConfig(config));
        });
    }
}
