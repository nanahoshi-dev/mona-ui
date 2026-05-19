import { computed, Directive, inject, input } from "@angular/core";
import { ThemeService } from "../../theme/services/theme.service";
import { type GridRowNeighborType } from "../models/GridRowNeighbourType";
import {
    gridCellPositionalBordersThemeResolver,
    gridListTableCellThemeVariants,
    type GridListTableCellVariantInput
} from "../styles/grid.styles";

@Directive({
    selector: "td[monaGridCell]",
    host: {
        "[class]": "baseClass()"
    }
})
export class GridCellDirective implements GridListTableCellVariantInput {
    readonly #themeService = inject(ThemeService);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        const dataCell = this.dataCell();
        const groupHeader = this.groupHeader();
        const groupToggle = this.groupToggle();
        const grouped = this.grouped();
        const indentCell = this.indentCell();
        const masterDetailContent = this.masterDetailContent();
        const masterDetailToggle = this.masterDetailToggle();
        const variantClass = gridListTableCellThemeVariants(theme)({
            dataCell,
            groupHeader,
            groupToggle,
            grouped,
            indentCell,
            masterDetailContent,
            masterDetailToggle
        });
        const positionalClass = gridCellPositionalBordersThemeResolver(theme)({
            grouped,
            groupHeader,
            dataCell,
            masterDetailToggle,
            prevRowType: this.prevRowType(),
            nextRowType: this.nextRowType()
        });
        return positionalClass ? `${variantClass} ${positionalClass}` : variantClass;
    });
    public readonly groupHeader = input(false);
    public readonly groupToggle = input(false);
    public readonly grouped = input(false);
    public readonly indentCell = input(false);
    public readonly masterDetailContent = input(false);
    public readonly masterDetailToggle = input(false);
    public readonly dataCell = input(false);
    public readonly prevRowType = input<GridRowNeighborType>(null);
    public readonly nextRowType = input<GridRowNeighborType>(null);
}
