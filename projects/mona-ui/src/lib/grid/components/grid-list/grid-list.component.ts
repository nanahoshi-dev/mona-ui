import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    DOCUMENT,
    ElementRef,
    inject,
    input
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ImmutableList, ImmutableSet, select, span } from "@mirei/ts-collections";
import { LucideAngularModule } from "lucide-angular";
import { fromEvent } from "rxjs";
import { ContextMenuComponent } from "../../../menus/contextmenu/components/contextmenu/context-menu.component";
import { SlicePipe } from "../../../pipes/slice.pipe";
import { ThemeService } from "../../../theme/services/theme.service";
import { GridCellDirective } from "../../directives/grid-cell.directive";
import { GridLogicalCellDirective } from "../../directives/grid-logical-cell.directive";
import { GridRowDirective } from "../../directives/grid-row.directive";
import { Column } from "../../models/Column";
import type { GridViewRow } from "../../models/GridGroup";
import { Row } from "../../models/Row";
import { GridNavigationService } from "../../services/grid-navigation.service";
import { GridRowFlattenerService } from "../../services/grid-row-flattener.service";
import { GridService } from "../../services/grid.service";
import {
    gridGroupRowThemeVariants,
    gridListBaseThemeVariants,
    gridListTableThemeVariants,
    GridListVariantInput
} from "../../styles/grid.styles";
import { GridCellComponent } from "../grid-cell/grid-cell.component";
import { GridToggleComponent } from "../grid-toggle/grid-toggle.component";

@Component({
    selector: "mona-grid-list",
    templateUrl: "./grid-list.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        GridCellComponent,
        FontAwesomeModule,
        NgTemplateOutlet,
        ContextMenuComponent,
        GridRowDirective,
        GridCellDirective,
        SlicePipe,
        LucideAngularModule,
        GridToggleComponent,
        GridLogicalCellDirective
    ],
    host: {
        "[class]": "baseClass()"
    }
})
export class GridListComponent implements GridListVariantInput {
    readonly #destroyRef = inject(DestroyRef);
    readonly #document = inject(DOCUMENT);
    readonly #gridNavigationService = inject(GridNavigationService);
    readonly #hostElementRef = inject(ElementRef<HTMLDivElement>);
    readonly #rowFlattener = inject(GridRowFlattenerService);
    readonly #themeService = inject(ThemeService);
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
        return this.#rowFlattener.flatten(this.data(), groupColumns, collapsedKeys);
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
            read: () => this.setSubscriptions()
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
        // fromEvent<MouseEvent>(this.#document, "click")
        //     .pipe(mergeWith(fromEvent<KeyboardEvent>(this.#document, "keyup")), takeUntilDestroyed(this.#destroyRef))
        //     .subscribe(e => {
        //         if (e.type === "click") {
        //             const event = e as MouseEvent;
        //             const target = event.target as HTMLElement;
        //             if (target.closest("mona-grid-cell") == null) {
        //                 this.gridService.isInEditMode.set(false);
        //             }
        //         }
        //         if (e.type === "keyup") {
        //             const event = e as KeyboardEvent;
        //             if (event.key === "Escape") {
        //                 this.gridService.isInEditMode.set(false);
        //             }
        //         }
        //     });
        fromEvent<FocusEvent>(this.#hostElementRef.nativeElement, "focus")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => {
                this.#gridNavigationService.focusFirstCell();
            });
        fromEvent(this.#hostElementRef.nativeElement, "scroll")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => {
                const headerElement = this.gridService.gridHeaderElement();
                if (headerElement && headerElement.scrollLeft !== this.#hostElementRef.nativeElement.scrollLeft) {
                    headerElement.scrollLeft = this.#hostElementRef.nativeElement.scrollLeft;
                }
            });
        const headerElement = this.gridService.gridHeaderElement();
        if (headerElement) {
            fromEvent(headerElement, "scroll")
                .pipe(takeUntilDestroyed(this.#destroyRef))
                .subscribe(() => {
                    const contentEl = this.#hostElementRef.nativeElement;
                    if (contentEl.scrollLeft !== headerElement.scrollLeft) {
                        contentEl.scrollLeft = headerElement.scrollLeft;
                    }
                });
        }
    }

    protected readonly span = span;
}
