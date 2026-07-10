import { NgTemplateOutlet } from "@angular/common";
import { afterNextRender, Component, computed, DestroyRef, ElementRef, inject, input, viewChild } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ImmutableList, ImmutableSet, span } from "@mirei/ts-collections";
import { SlicePipe } from "@nanahoshi/mona-ui/common";
import { ContextMenuComponent } from "@nanahoshi/mona-ui/contextmenu";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import { fromEvent } from "rxjs";
import { GridCellDirective } from "../../directives/grid-cell.directive";
import { GridDetailContentCellDirective } from "../../directives/grid-detail-content-cell.directive";
import { GridDetailIndentCellDirective } from "../../directives/grid-detail-indent-cell.directive";
import { GridDetailRowDirective } from "../../directives/grid-detail-row.directive";
import { GridFooterTableCellDirective } from "../../directives/grid-footer-table-cell.directive";
import { GridLockedCellDirective } from "../../directives/grid-locked-cell.directive";
import { GridLogicalCellDirective } from "../../directives/grid-logical-cell.directive";
import { GridRowDirective } from "../../directives/grid-row.directive";
import { Column } from "../../models/Column";
import type { GridViewRow } from "../../models/GridGroup";
import { Row } from "../../models/Row";
import { GridNavigationService } from "../../services/grid-navigation.service";
import { GridRowFlattenerService } from "../../services/grid-row-flattener.service";
import { GridService } from "../../services/grid.service";
import {
    gridFooterTableRowThemeVariants,
    gridGroupRowThemeVariants,
    gridListBaseThemeVariants,
    gridListTableThemeVariants,
    GridListVariantInput
} from "../../styles/grid.styles";
import { GridAddRowComponent } from "../grid-add-row/grid-add-row.component";
import { GridCellComponent } from "../grid-cell/grid-cell.component";
import { GridFooterCellComponent } from "../grid-footer-cell/grid-footer-cell.component";
import { GridToggleComponent } from "../grid-toggle/grid-toggle.component";

@Component({
    selector: "mona-grid-list",
    templateUrl: "./grid-list.component.html",
    imports: [
        GridAddRowComponent,
        GridCellComponent,
        NgTemplateOutlet,
        ContextMenuComponent,
        GridRowDirective,
        GridCellDirective,
        GridDetailRowDirective,
        GridDetailIndentCellDirective,
        GridDetailContentCellDirective,
        SlicePipe,
        GridToggleComponent,
        GridFooterTableCellDirective,
        GridLogicalCellDirective,
        GridLockedCellDirective,
        GridFooterCellComponent
    ],
    host: {
        "[class]": "baseClass()"
    }
})
export class GridListComponent implements GridListVariantInput {
    readonly #destroyRef = inject(DestroyRef);
    readonly #gridNavigationService = inject(GridNavigationService);
    readonly #hostElementRef = inject(ElementRef<HTMLDivElement>);
    readonly #rowFlattener = inject(GridRowFlattenerService);
    readonly #themeService = inject(ThemeService);
    private readonly bodyTableElementRef = viewChild.required<ElementRef<HTMLTableElement>>("bodyTable");
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridListBaseThemeVariants(theme)({ virtual: false });
    });
    protected readonly flattenedGroupedRows = computed<GridViewRow[]>(() => {
        const groupColumns = this.gridService.groupColumns();
        if (groupColumns.length === 0) {
            return [];
        }
        const collapsedKeys = new Set(this.gridService.collapsedGroupKeys());
        const groupAggregateDict = this.gridService.groupAggregateMap().toDictionary(
            e => e.key,
            e => e.value
        );
        const showFooter = this.gridService.groupableOptions().showFooter;
        return this.#rowFlattener.flatten(this.data(), groupColumns, collapsedKeys, showFooter, groupAggregateDict);
    });
    protected readonly footerTableRowClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridFooterTableRowThemeVariants(theme)();
    });
    protected readonly gridService = inject(GridService);
    protected readonly groupRowClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridGroupRowThemeVariants(theme)();
    });
    protected readonly tableClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridListTableThemeVariants(theme)();
    });

    public readonly columns = input<ImmutableList<Column>>(ImmutableList.create());
    public readonly data = input<ImmutableSet<Row>>(ImmutableSet.create());

    public constructor() {
        afterNextRender({
            read: () => {
                const bodyTableElement = this.bodyTableElementRef().nativeElement;
                const bodyScrollElement = this.#hostElementRef.nativeElement;
                this.gridService.bodyTableElement.set(bodyTableElement);
                this.gridService.bodyScrollElement.set(bodyScrollElement);
                this.setSubscriptions();
                this.#destroyRef.onDestroy(() => {
                    if (this.gridService.bodyTableElement() === bodyTableElement) {
                        this.gridService.bodyTableElement.set(null);
                    }
                    if (this.gridService.bodyScrollElement() === bodyScrollElement) {
                        this.gridService.bodyScrollElement.set(null);
                    }
                });
            }
        });
    }

    public onGridRowClick(event: MouseEvent, row: Row): void {
        this.gridService.handleRowClick(event, row);
    }

    public onGroupExpandChange(groupKey: string): void {
        this.gridService.toggleGroupCollapse(groupKey);
    }

    public onToggleDetailClick(row: Row): void {
        const expanded = this.gridService.isRowExpanded(row);
        this.gridService.setRowExpanded(row, !expanded);
    }

    private setSubscriptions(): void {
        fromEvent<FocusEvent>(this.#hostElementRef.nativeElement, "focus")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => {
                this.#gridNavigationService.focusActiveCellOrFirstHeader();
            });
    }

    protected readonly span = span;
}
