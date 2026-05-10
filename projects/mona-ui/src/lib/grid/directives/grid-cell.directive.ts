import { afterRenderEffect, computed, DestroyRef, Directive, ElementRef, inject, input } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { filter, fromEvent, tap } from "rxjs";
import { ThemeService } from "../../theme/services/theme.service";
import { GridNavigationService } from "../services/grid-navigation.service";
import { gridListTableCellThemeVariants, GridListTableCellVariantInput } from "../styles/grid.styles";

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
        return gridListTableCellThemeVariants(theme)({
            dataCell,
            groupHeader,
            groupToggle,
            grouped,
            indentCell,
            masterDetailContent,
            masterDetailToggle
        });
    });
    public readonly groupHeader = input(false);
    public readonly groupToggle = input(false);
    public readonly grouped = input(false);
    public readonly indentCell = input(false);
    public readonly masterDetailContent = input(false);
    public readonly masterDetailToggle = input(false);
    public readonly dataCell = input(false);
}
