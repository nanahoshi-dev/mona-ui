import { computed, Directive, inject, input } from "@angular/core";
import { Column } from "../models/Column";
import { gridFooterTableCellThemeVariants } from "../styles/grid.styles";

@Directive({
    selector: "td[monaGridFooterTableCell]",
    host: {
        "[class]": "className()",
        "[style.width.px]": "width()",
        "[style.min-width.px]": "minWidth()"
    }
})
export class GridFooterTableCellDirective {
    protected readonly className = computed(() => {
        return gridFooterTableCellThemeVariants();
    });
    protected readonly minWidth = computed(() => this.footerColumn()?.minWidth ?? this.footerCellMinWidth());
    protected readonly width = computed(() => this.footerColumn()?.calculatedWidth ?? this.footerCellWidth());

    public readonly footerCellMinWidth = input<number | null>(null);
    public readonly footerCellWidth = input<number | null>(null);
    public readonly footerColumn = input<Column | null>(null);
}
