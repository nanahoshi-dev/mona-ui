import { computed, Directive, inject, input } from "@angular/core";
import { ThemeService } from "../../theme/services/theme.service";
import { gridListTableCellThemeVariants } from "../styles/grid.styles";

@Directive({
    selector: "[monaGridCell]",
    host: {
        "[class]": "baseClass()"
    }
})
export class GridCellDirective {
    readonly #themeService = inject(ThemeService);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const hasRightBorder = this.hasRightBorder();
        return gridListTableCellThemeVariants(theme)({ hasRightBorder });
    });

    public readonly hasRightBorder = input.required<boolean>();
}
