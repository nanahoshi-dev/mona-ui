import { computed, Directive, inject, input } from "@angular/core";
import { ThemeService } from "../../theme/services/theme.service";
import type { GridRowNeighborType } from "../models/GridRowNeighbourType";
import { gridDetailIndentCellThemeVariants } from "../styles/grid.styles";

@Directive({
    selector: "td[monaGridDetailIndentCell]",
    host: {
        "[class]": "baseClass()"
    }
})
export class GridDetailIndentCellDirective {
    readonly #themeService = inject(ThemeService);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridDetailIndentCellThemeVariants(theme)({
            nextIsGroup: this.nextRowType() === "group"
        });
    });
    public readonly nextRowType = input<GridRowNeighborType>(null);
}
