import { computed, Directive, inject, input } from "@angular/core";
import type { GridRowNeighborType } from "../models/GridRowNeighbourType";
import { gridDetailContentCellThemeVariants } from "../styles/grid.styles";

@Directive({
    selector: "td[monaGridDetailContentCell]",
    host: {
        "[class]": "baseClass()"
    }
})
export class GridDetailContentCellDirective {
    protected readonly baseClass = computed(() => {
        return gridDetailContentCellThemeVariants({
            nextIsGroup: this.nextRowType() === "group"
        });
    });
    public readonly nextRowType = input<GridRowNeighborType>(null);
}
