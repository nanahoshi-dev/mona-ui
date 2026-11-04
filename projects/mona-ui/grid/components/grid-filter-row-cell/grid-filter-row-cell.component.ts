import { NgTemplateOutlet } from "@angular/common";
import {
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
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { deepEquals } from "@nanahoshi/mona-ui/common";
import { DatePickerComponent } from "@nanahoshi/mona-ui/date-picker";
import { DropdownListComponent } from "@nanahoshi/mona-ui/dropdown-list";
import { type FilterMenuDataItem, type FilterMenuValue, FilterService } from "@nanahoshi/mona-ui/filter";
import { NumericTextBoxComponent } from "@nanahoshi/mona-ui/numeric-text-box";
import { PopupMenuCheckboxItemComponent, PopupMenuComponent } from "@nanahoshi/mona-ui/popup-menu";
import type {
    BooleanFilterOperators,
    CompositeFilterDescriptor,
    DateFilterOperators,
    FilterOperators,
    NumericFilterOperators,
    StringFilterOperators
} from "@nanahoshi/mona-ui/query";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";
import { map, of, Subject, switchMap, timer } from "rxjs";
import { Column } from "../../models/Column";
import type { ColumnFilterState } from "../../models/ColumnFilterState";
import { GridService } from "../../services/grid.service";
import { gridFilterRowCellThemeVariants } from "../../styles/grid.styles";

type RowFilterOperator = Exclude<FilterOperators, "function">;
type RowFilterValue = string | number | Date | boolean | null | undefined;

/** How long typing waits before it filters. */
const INPUT_DEBOUNCE = 300;

interface PendingFilter {
    readonly delay: number;
    readonly state: ColumnFilterState;
}

const VALUELESS_OPERATORS: ReadonlySet<FilterOperators> = new Set<FilterOperators>([
    "isempty",
    "isnotempty",
    "isnotnull",
    "isnotnullorempty",
    "isnull",
    "isnullorempty"
]);

/**
 * One column's cell in the filter row: a value input, an operator menu and a Clear button. Typing filters after a
 * short pause; anything else, Clear included, filters at once and drops typing that has not filtered yet.
 */
@Component({
    selector: "mona-grid-filter-row-cell",
    templateUrl: "./grid-filter-row-cell.component.html",
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
    /** This column's applied filter; other columns' changes don't reach it. */
    readonly #appliedValue = computed<FilterMenuValue | null>(
        () => this.#gridService.appliedFilters().get(this.column().field)?.filterMenuValue ?? null,
        { equal: deepEquals }
    );
    /** The column's data type; marking the column filtered replaces its object, but not its type. */
    readonly #dataType = computed(() => this.column().dataType);
    readonly #destroyRef = inject(DestroyRef);
    readonly #filterService = inject(FilterService);
    readonly #gridService = inject(GridService);
    readonly #pending$ = new Subject<PendingFilter>();
    /** What this cell last asked for, so its own filter coming back does not overwrite newer typing. */
    #emittedValue: FilterMenuValue | null = null;
    protected readonly baseClass = computed(() => {
        return gridFilterRowCellThemeVariants();
    });
    protected readonly booleanFilterMenuItems = computed(() => this.#filterService.booleanFilterMenuItems);
    protected readonly booleanValue = signal<FilterMenuDataItem | null>(null);
    /** The column's format string; without one, the date picker uses the locale's date format. */
    protected readonly dateFormat = computed(() => {
        const format = this.column().format;
        return typeof format === "string" ? format : null;
    });
    protected readonly dateValue = signal<Date | null>(null);
    protected readonly isFilterActive = computed(() => {
        const op = this.selectedOperator();
        if (VALUELESS_OPERATORS.has(op)) {
            return true;
        }
        switch (this.#dataType()) {
            case "string":
                return this.stringValue().trim().length > 0;
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
    protected readonly messages = this.#gridService.messages;
    protected readonly numberValue = signal<number | null>(null);
    /** The operators of the column's type, with labels that follow the locale. */
    protected readonly operatorItems = computed<FilterMenuDataItem[]>(() => {
        switch (this.#dataType()) {
            case "string":
                return this.#filterService.stringFilterMenuItems;
            case "number":
                return this.#filterService.numericFilterMenuItems;
            case "date":
                return this.#filterService.dateFilterMenuItems;
            default:
                return [];
        }
    });
    /** The operator button's name: the column and its current operator. */
    protected readonly operatorLabel = computed(() => {
        const operator = this.selectedOperator();
        const text = this.operatorItems().find(item => item.value === operator)?.text ?? "";
        return this.messages().filterOperator(this.column().title, text);
    });
    protected readonly operatorMenuOpen = signal(false);
    /** Resets to the type's default only when the column's type changes. */
    protected readonly selectedOperator = linkedSignal<RowFilterOperator>(() => this.#getDefaultOperator());
    protected readonly stringValue = signal<string>("");

    public readonly apply = output<ColumnFilterState>();
    public readonly column = input.required<Column>();

    public constructor() {
        effect(() => {
            const value = this.#appliedValue();
            untracked(() => {
                if (!deepEquals(value, this.#emittedValue)) {
                    this.#emittedValue = value;
                    this.#syncFromFilterValue(value);
                }
            });
        });
        this.#pending$
            .pipe(
                switchMap(pending =>
                    pending.delay > 0 ? timer(pending.delay).pipe(map(() => pending.state)) : of(pending.state)
                ),
                takeUntilDestroyed(this.#destroyRef)
            )
            .subscribe(state => {
                // Nothing to clear: the pending filter is dropped and no filter change is reported.
                if (state.filterMenuValue == null && this.#appliedValue() == null) {
                    return;
                }
                this.apply.emit(state);
            });
    }

    protected onBooleanChange(value: FilterMenuDataItem | null): void {
        this.booleanValue.set(value);
        if (value == null) {
            this.#queueClear();
            return;
        }
        this.selectedOperator.set(value.value as RowFilterOperator);
        this.#queueFilter(this.#getBooleanValue(value));
    }

    protected onClear(): void {
        this.stringValue.set("");
        this.numberValue.set(null);
        this.dateValue.set(null);
        this.booleanValue.set(null);
        this.selectedOperator.set(this.#getDefaultOperator());
        this.#queueClear();
    }

    protected onDateChange(value: Date | null): void {
        this.dateValue.set(value);
        if (value) {
            this.#queueFilter(value);
        } else {
            this.#queueClear();
        }
    }

    protected onNumberChange(value: number | null): void {
        this.numberValue.set(value);
        if (value != null) {
            this.#queueFilter(value, INPUT_DEBOUNCE);
        } else {
            this.#queueClear(INPUT_DEBOUNCE);
        }
    }

    /** A valueless operator filters at once; any other waits for a value, and keeps the cell's choice. */
    protected onOperatorChange(operator: FilterOperators): void {
        this.selectedOperator.set(operator as RowFilterOperator);
        if (VALUELESS_OPERATORS.has(operator)) {
            this.#queueFilter(null);
            return;
        }
        switch (this.#dataType()) {
            case "string":
                if (this.stringValue().trim()) {
                    this.#queueFilter(this.stringValue().trim());
                } else {
                    this.#queueClear();
                }
                break;
            case "number":
                if (this.numberValue() !== null) {
                    this.#queueFilter(this.numberValue());
                } else {
                    this.#queueClear();
                }
                break;
            case "date":
                if (this.dateValue()) {
                    this.#queueFilter(this.dateValue());
                } else {
                    this.#queueClear();
                }
                break;
        }
    }

    protected onStringChange(value: string): void {
        this.stringValue.set(value);
        const trimmed = value.trim();
        if (trimmed) {
            this.#queueFilter(trimmed, INPUT_DEBOUNCE);
        } else {
            this.#queueClear(INPUT_DEBOUNCE);
        }
    }

    #buildFilter(value: RowFilterValue): CompositeFilterDescriptor {
        const operator = this.selectedOperator();
        const field = this.column().field;
        switch (this.#dataType()) {
            case "number":
                return this.#filterService.buildNumberFilterDescriptor({
                    field,
                    logic: null,
                    operator1: operator as NumericFilterOperators,
                    value1: value as number
                });
            case "date":
                return this.#filterService.buildDateFilterDescriptor({
                    field,
                    logic: null,
                    operator1: operator as DateFilterOperators,
                    value1: value as Date
                });
            case "boolean":
                return this.#filterService.buildBooleanFilterDescriptor({
                    field,
                    logic: null,
                    operator1: operator as BooleanFilterOperators,
                    value1: value != null ? (value as boolean) : null
                });
            default:
                return this.#filterService.buildStringFilterDescriptor({
                    field,
                    logic: null,
                    operator1: operator as StringFilterOperators,
                    value1: value as string
                });
        }
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
        return this.#dataType() === "string" ? "contains" : "eq";
    }

    #queue(state: ColumnFilterState, delay: number): void {
        this.#emittedValue = state.filterMenuValue ?? null;
        this.#pending$.next({ delay, state });
    }

    #queueClear(delay = 0): void {
        this.#queue({ filter: { logic: "and", filters: [] } }, delay);
    }

    #queueFilter(value: RowFilterValue, delay = 0): void {
        const filterMenuValue: FilterMenuValue = { operator1: this.selectedOperator(), value1: value };
        this.#queue({ filter: this.#buildFilter(value), filterMenuValue }, delay);
    }

    #syncFromFilterValue(value: FilterMenuValue | null): void {
        this.stringValue.set("");
        this.numberValue.set(null);
        this.dateValue.set(null);
        this.booleanValue.set(null);
        if (value == null) {
            this.selectedOperator.set(this.#getDefaultOperator());
            return;
        }
        this.selectedOperator.set((value.operator1 as RowFilterOperator | undefined) ?? this.#getDefaultOperator());
        switch (this.#dataType()) {
            case "string":
                this.stringValue.set((value.value1 as string | null) ?? "");
                break;
            case "number":
                this.numberValue.set((value.value1 as number | null) ?? null);
                break;
            case "date":
                this.dateValue.set((value.value1 as Date | null) ?? null);
                break;
            case "boolean":
                this.booleanValue.set(this.booleanFilterMenuItems().find(i => i.value === value.operator1) ?? null);
                break;
        }
    }
}
