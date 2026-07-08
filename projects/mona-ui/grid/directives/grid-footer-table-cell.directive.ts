import { computed, Directive, inject, input } from "@angular/core";
import { ThemeService } from "@mirei/mona-ui/theme";
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
    readonly #themeService = inject(ThemeService);
    protected readonly className = computed(() => {
        const theme = this.#themeService.theme();
        return gridFooterTableCellThemeVariants(theme)();
    });
    protected readonly minWidth = computed(() => this.footerColumn()?.minWidth ?? this.footerCellMinWidth());
    protected readonly width = computed(() => this.footerColumn()?.calculatedWidth ?? this.footerCellWidth());

    public readonly footerCellMinWidth = input<number | null>(null);
    public readonly footerCellWidth = input<number | null>(null);
    public readonly footerColumn = input<Column | null>(null);
}
