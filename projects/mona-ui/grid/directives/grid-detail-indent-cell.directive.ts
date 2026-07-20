import { computed, Directive, inject, input } from "@angular/core";
import type { GridRowNeighborType } from "../models/GridRowNeighbourType";
import { gridDetailIndentCellThemeVariants } from "../styles/grid.styles";

@Directive({
    selector: "td[monaGridDetailIndentCell]",
    host: {
        "[class]": "baseClass()"
    }
})
export class GridDetailIndentCellDirective {
    protected readonly baseClass = computed(() => {
        return gridDetailIndentCellThemeVariants({
            nextIsGroup: this.nextRowType() === "group"
        });
    });
    public readonly nextRowType = input<GridRowNeighborType>(null);
}
