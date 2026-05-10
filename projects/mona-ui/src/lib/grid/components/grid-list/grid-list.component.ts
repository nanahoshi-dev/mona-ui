import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    DOCUMENT,
    effect,
    ElementRef,
    inject,
    input,
    untracked
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Dictionary, ImmutableList, ImmutableSet, span } from "@mirei/ts-collections";
import { cx } from "class-variance-authority";
import { LucideAngularModule } from "lucide-angular";
import { fromEvent, mergeWith } from "rxjs";
import { ContextMenuComponent } from "../../../menus/contextmenu/components/contextmenu/context-menu.component";
import { ElementAtPipe } from "../../../pipes/element-at.pipe";
import { SlicePipe } from "../../../pipes/slice.pipe";
import { ThemeService } from "../../../theme/services/theme.service";
import { GridCellDirective } from "../../directives/grid-cell.directive";
import { GridRowDirective } from "../../directives/grid-row.directive";
import { Column } from "../../models/Column";
import { GridGroup } from "../../models/GridGroup";
import { Row } from "../../models/Row";
import { GridGroupPipe } from "../../pipes/grid-group.pipe";
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
        GridGroupPipe,
        ElementAtPipe,
        ContextMenuComponent,
        GridRowDirective,
        GridCellDirective,
        SlicePipe,
        LucideAngularModule,
        GridToggleComponent
    ],
    host: {
        "[class]": "baseClass()"
    }
})
export class GridListComponent implements GridListVariantInput {
    readonly #destroyRef = inject(DestroyRef);
    readonly #document = inject(DOCUMENT);
    readonly #hostElementRef = inject(ElementRef<HTMLDivElement>);
    readonly #themeService = inject(ThemeService);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridListBaseThemeVariants(theme)({ virtual: false });
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
        effect(() => untracked(() => this.synchronizeHorizontalScroll()));
    }

    public onGridRowClick(event: MouseEvent, row: Row): void {
        this.gridService.handleRowClick(event, row);
    }

    public onGroupExpandChange(group: GridGroup): void {
        group.collapsed = !group.collapsed;
        const groupKey = `${group.column.field()}-${group.rows[0].data[group.column.field()]}`;
        const state = this.gridService.gridGroupExpandState.get(groupKey);
        if (state == null) {
            this.gridService.gridGroupExpandState.add(
                groupKey,
                new Dictionary<number, boolean>([[this.gridService.pageState.page(), group.collapsed]])
            );
        } else if (state.containsKey(this.gridService.pageState.page())) {
            const value = state.get(this.gridService.pageState.page());
            if (value != null) {
                state.remove(this.gridService.pageState.page());
                state.add(this.gridService.pageState.page(), !value);
            }
        } else {
            state.add(this.gridService.pageState.page(), group.collapsed);
        }
    }

    public onToggleDetailClick(row: Row): void {
        const expanded = this.gridService.isRowExpanded(row);
        this.gridService.setRowExpanded(row, !expanded);
    }

    private setSubscriptions(): void {
        fromEvent<MouseEvent>(this.#document, "click")
            .pipe(mergeWith(fromEvent<KeyboardEvent>(this.#document, "keyup")), takeUntilDestroyed(this.#destroyRef))
            .subscribe(e => {
                if (e.type === "click") {
                    const event = e as MouseEvent;
                    const target = event.target as HTMLElement;
                    if (target.closest("mona-grid-cell") == null) {
                        this.gridService.isInEditMode.set(false);
                    }
                }
                if (e.type === "keyup") {
                    const event = e as KeyboardEvent;
                    if (event.key === "Escape") {
                        this.gridService.isInEditMode.set(false);
                    }
                }
            });
    }

    private synchronizeHorizontalScroll(): void {
        const headerElement = this.gridService.gridHeaderElement();
        const gridElement = this.#hostElementRef.nativeElement as HTMLElement;
        if (headerElement == null || gridElement == null) {
            return;
        }
        fromEvent(gridElement, "scroll")
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe(() => {
                headerElement.scrollLeft = gridElement.scrollLeft;
            });
    }

    protected readonly span = span;
    protected readonly cx = cx;
}
