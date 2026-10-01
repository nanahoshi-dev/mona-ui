import { computed, Directive } from "@angular/core";
import { gridDetailRowThemeVariants } from "../styles/grid.styles";

@Directive({
    selector: "tr[monaGridDetailRow]",
    host: {
        "[class]": "baseClass()",
        role: "row"
    }
})
export class GridDetailRowDirective {
    protected readonly baseClass = computed(() => {
        return gridDetailRowThemeVariants();
    });
}
