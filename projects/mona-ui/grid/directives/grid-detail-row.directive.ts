import { computed, Directive, inject } from "@angular/core";
import { gridDetailRowThemeVariants } from "../styles/grid.styles";

@Directive({
    selector: "tr[monaGridDetailRow]",
    host: {
        "[class]": "baseClass()"
    }
})
export class GridDetailRowDirective {
    protected readonly baseClass = computed(() => {
        return gridDetailRowThemeVariants();
    });
}
