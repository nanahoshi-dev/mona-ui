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
    public readonly editable = input<boolean>(true);
    public readonly field = input<string>("");
    public readonly maxWidth = input<number | null>(null);
    public readonly minWidth = input<number>(40);
    public readonly title = input<string>("");
    public readonly type = input<DataType>("string");
    public readonly width = input<number | undefined>(undefined);

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
                width: this.width()
            };
            untracked(() => this.column.setConfig(config));
        });
    }
}
