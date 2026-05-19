import { computed, Directive, inject } from "@angular/core";
import { ThemeService } from "../../theme/services/theme.service";
import { gridDetailRowThemeVariants } from "../styles/grid.styles";

@Directive({
    selector: "tr[monaGridDetailRow]",
    host: {
        "[class]": "baseClass()"
    }
})
export class GridDetailRowDirective {
    readonly #themeService = inject(ThemeService);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridDetailRowThemeVariants(theme)();
    });
}
