import { NgTemplateOutlet } from "@angular/common";
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    effect,
    inject,
    input,
    linkedSignal,
    output,
    signal,
    untracked
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { LucideFunnel, LucideFunnelX } from "@lucide/angular";
import { debounceTime, Subject } from "rxjs";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { PopupMenuCheckboxItemComponent, PopupMenuComponent } from "@nanahoshi/mona-ui/popup-menu";
import { DatePickerComponent } from "@nanahoshi/mona-ui/date-picker";
import { DropdownListComponent } from "@nanahoshi/mona-ui/dropdown-list";
import { FilterService, type FilterMenuDataItem, type FilterMenuValue } from "@nanahoshi/mona-ui/filter";
import { NumericTextBoxComponent } from "@nanahoshi/mona-ui/numeric-text-box";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";
import type {
    BooleanFilterOperators,
    CompositeFilterDescriptor,
    DateFilterOperators,
    FilterOperators,
    NumericFilterOperators,
    StringFilterOperators
} from "@nanahoshi/mona-ui/query";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import { Column } from "../../models/Column";
import type { ColumnFilterState } from "../../models/ColumnFilterState";
import { GridService } from "../../services/grid.service";
import { gridFilterRowCellThemeVariants } from "../../styles/grid.styles";

type RowFilterOperator = Exclude<FilterOperators, "function">;
type RowFilterValue = string | number | Date | boolean | null | undefined;

@Component({
    selector: "mona-grid-filter-row-cell",
    templateUrl: "./grid-filter-row-cell.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        FormsModule,
        TextBoxComponent,
        NumericTextBoxComponent,
        DatePickerComponent,
        DropdownListComponent,
        ButtonDirective,
        PopupMenuComponent,
        PopupMenuCheckboxItemComponent,
        NgTemplateOutlet,
        LucideFunnelX,
        LucideFunnel
    ],
    host: {
        "[class]": "baseClass()"
    }
})
export class GridFilterRowCellComponent {
    readonly #destroyRef = inject(DestroyRef);
    readonly #filterService = inject(FilterService);
    readonly #gridService = inject(GridService);
    readonly #numberInput$ = new Subject<number | null>();
    readonly #stringInput$ = new Subject<string>();
    readonly #themeService = inject(ThemeService);
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        return gridFilterRowCellThemeVariants(theme)();
    });
    protected readonly isFilterActive = computed(() => {
        const op = this.selectedOperator();
        if (op === "isnull" || op === "isnotnull") {
            return true;
        }
        switch (this.column().dataType) {
            case "string":
                return (
                    this.stringValue().trim().length > 0 ||
                    op === "isempty" ||
                    op === "isnotempty" ||
                    op === "isnullorempty" ||
                    op === "isnotnullorempty"
                );
            case "number":
                return this.numberValue() !== null;
            case "date":
                return this.dateValue() !== null;
            case "boolean":
                return this.booleanValue() !== null;
            default:
                return false;
        }
    });
    protected readonly booleanFilterMenuItems = this.#filterService.booleanFilterMenuItems;
    protected readonly booleanValue = signal<FilterMenuDataItem | null>(null);
    protected readonly dateFilterMenuItems = this.#filterService.dateFilterMenuItems;
    protected readonly dateValue = signal<Date | null>(null);
    protected readonly numberValue = signal<number | null>(null);
    protected readonly numericFilterMenuItems = this.#filterService.numericFilterMenuItems;
    protected readonly selectedOperator = linkedSignal<RowFilterOperator>(() => this.#getDefaultOperator());
    protected readonly stringFilterMenuItems = this.#filterService.stringFilterMenuItems;
    protected readonly stringValue = signal<string>("");

    public readonly apply = output<ColumnFilterState>();
    public readonly column = input.required<Column>();

    public constructor() {
        effect(() => {
            const filterState = this.#gridService.appliedFilters().get(this.column().field) ?? null;
            untracked(() => this.#syncFromFilterState(filterState));
        });
        this.#setValueChangeSubscriptions();
    }

    protected onBooleanChange(value: FilterMenuDataItem): void {
        this.booleanValue.set(value);
        this.selectedOperator.set(value.value as RowFilterOperator);
        this.#emitFilter(this.#getBooleanValue(value));
    }

    protected onClear(): void {
        this.stringValue.set("");
        this.numberValue.set(null);
        this.dateValue.set(null);
        this.booleanValue.set(null);
        this.selectedOperator.set(this.#getDefaultOperator());
        this.#emitClearFilter();
    }

    protected onDateChange(value: Date | null): void {
        this.dateValue.set(value);
        if (value) {
            this.#emitFilter(value);
        } else {
            this.#emitClearFilter();
        }
    }

    protected onNumberChange(value: number | null): void {
        this.numberValue.set(value);
        this.#numberInput$.next(value);
    }

    protected onOperatorChange(operator: FilterOperators): void {
        this.selectedOperator.set(operator as RowFilterOperator);
        const isValueless =
            operator === "isnull" ||
            operator === "isnotnull" ||
            operator === "isempty" ||
            operator === "isnotempty" ||
            operator === "isnullorempty" ||
            operator === "isnotnullorempty";
        if (isValueless) {
            this.#emitFilter(null);
            return;
        }
        switch (this.column().dataType) {
            case "string":
                if (this.stringValue().trim()) {
                    this.#emitFilter(this.stringValue());
                }
                break;
            case "number":
                if (this.numberValue() !== null) {
                    this.#emitFilter(this.numberValue());
                }
                break;
            case "date":
                if (this.dateValue()) {
                    this.#emitFilter(this.dateValue());
                }
                break;
        }
    }

    protected onStringChange(value: string): void {
        this.stringValue.set(value);
        this.#stringInput$.next(value);
    }

    #emitClearFilter(): void {
        this.apply.emit({ filter: { logic: "and", filters: [] } });
    }

    #emitFilter(value: RowFilterValue): void {
        const operator = this.selectedOperator();
        const field = this.column().field;
        let filter: CompositeFilterDescriptor;
        let filterOperator = operator;
        switch (this.column().dataType) {
            case "string":
                filter = this.#filterService.buildStringFilterDescriptor({
                    field,
                    logic: null,
                    operator1: operator as StringFilterOperators,
                    value1: value as string
                });
                break;
            case "number":
                filter = this.#filterService.buildNumberFilterDescriptor({
                    field,
                    logic: null,
                    operator1: operator as NumericFilterOperators,
                    value1: value as number
                });
                break;
            case "date":
                filter = this.#filterService.buildDateFilterDescriptor({
                    field,
                    logic: null,
                    operator1: operator as DateFilterOperators,
                    value1: value as Date
                });
                break;
            case "boolean":
                filter = this.#filterService.buildBooleanFilterDescriptor({
                    field,
                    logic: null,
                    operator1: operator as BooleanFilterOperators,
                    value1: value != null ? (value as boolean) : null
                });
                break;
        }
        const filterMenuValue: FilterMenuValue = { operator1: filterOperator, value1: value };
        this.apply.emit({ filter, filterMenuValue });
    }

    #getBooleanValue(item: FilterMenuDataItem): boolean | null {
        if (item.value === "istrue") {
            return true;
        }
        if (item.value === "isfalse") {
            return false;
        }
        return null;
    }

    #getDefaultOperator(): RowFilterOperator {
        const dataType = this.column().dataType;
        return dataType === "string" ? "contains" : "eq";
    }

    #syncFromFilterState(filterState: ColumnFilterState | null): void {
        const column = this.column();
        const dataType = column.dataType;
        if (!filterState?.filterMenuValue) {
            this.stringValue.set("");
            this.numberValue.set(null);
            this.dateValue.set(null);
            this.booleanValue.set(null);
            this.selectedOperator.set(this.#getDefaultOperator());
            return;
        }
        const v = filterState.filterMenuValue;
        switch (dataType) {
            case "string":
                this.selectedOperator.set(v.operator1 as RowFilterOperator);
                this.stringValue.set((v.value1 as string) ?? "");
                break;
            case "number":
                this.selectedOperator.set(v.operator1 as RowFilterOperator);
                this.numberValue.set((v.value1 as number) ?? null);
                break;
            case "date":
                this.selectedOperator.set(v.operator1 as RowFilterOperator);
                this.dateValue.set((v.value1 as Date) ?? null);
                break;
            case "boolean":
                this.selectedOperator.set(v.operator1 as RowFilterOperator);
                const item = this.booleanFilterMenuItems.find(i => i.value === v.operator1) ?? null;
                this.booleanValue.set(item);
                break;
        }
    }

    #setValueChangeSubscriptions(): void {
        this.#stringInput$.pipe(debounceTime(300), takeUntilDestroyed(this.#destroyRef)).subscribe(value => {
            if (value.trim()) {
                this.#emitFilter(value);
            } else {
                this.#emitClearFilter();
            }
        });

        this.#numberInput$.pipe(debounceTime(300), takeUntilDestroyed(this.#destroyRef)).subscribe(value => {
            if (value !== null && value !== undefined) {
                this.#emitFilter(value);
            } else {
                this.#emitClearFilter();
            }
        });
    }
}
