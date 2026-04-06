import { inject, Pipe, PipeTransform } from "@angular/core";
import { ThemeService } from "../../theme/services/theme.service";
import { gridListTableRowThemeVariants } from "../styles/grid.styles";

@Pipe({
    name: "gridRowStyle"
})
export class GridRowStylePipe implements PipeTransform {
    readonly #themeService = inject(ThemeService);
    public transform(selected: boolean): string {
        const theme = this.#themeService.theme();
        return gridListTableRowThemeVariants(theme)({ selected });
    }
}
