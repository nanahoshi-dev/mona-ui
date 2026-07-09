import { computed, Directive, inject, input } from "@angular/core";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import type { GridRowNeighborType } from "../models/GridRowNeighbourType";
import { gridDetailContentCellThemeVariants } from "../styles/grid.styles";

@Directive({
    selector: "td[monaGridDetailContentCell]",
    host: {
        "[class]": "baseClass()"
    }
})
export class GridDetailContentCellDirective {
    readonly #themeService = inject(ThemeService);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridDetailContentCellThemeVariants(theme)({
            nextIsGroup: this.nextRowType() === "group"
        });
    });
    public readonly nextRowType = input<GridRowNeighborType>(null);
}
