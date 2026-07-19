import { inject, Pipe, PipeTransform } from "@angular/core";
import { gridListTableRowThemeVariants } from "../styles/grid.styles";

@Pipe({
    name: "gridRowStyle"
})
export class GridRowStylePipe implements PipeTransform {
    public transform(selected: boolean): string {
        return gridListTableRowThemeVariants({ selected });
    }
}
