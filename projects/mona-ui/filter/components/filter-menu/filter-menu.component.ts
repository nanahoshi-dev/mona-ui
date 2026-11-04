import { Component, computed, effect, inject, input, model, output, signal, untracked } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { ButtonGroupComponent } from "@nanahoshi/mona-ui/button-group";
import { DataType } from "@nanahoshi/mona-ui/common";
import { DatePickerComponent } from "@nanahoshi/mona-ui/date-picker";
import { DropdownListComponent } from "@nanahoshi/mona-ui/dropdown-list";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { NumericTextBoxComponent } from "@nanahoshi/mona-ui/numeric-text-box";
import {
    BooleanFilterOperators,
    CompositeFilterDescriptor,
    DateFilterOperators,
    FilterOperators,
    NumericFilterOperators,
    StringFilterOperators
} from "@nanahoshi/mona-ui/query";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";
import { FILTER_DEFAULT_MESSAGES } from "../../i18n/filter.default-messages";
import { FilterMenuConnectorItem } from "../../models/FilterMenuConnectorItem";
import { FilterMenuDataItem } from "../../models/FilterMenuDataItem";
import type { FilterMenuDateOptions } from "../../models/FilterMenuDateOptions";
import { FilterMenuValue } from "../../models/FilterMenuValue";
import { OperatorFilterPipe } from "../../pipes/operator-filter.pipe";
import { ValuelessOperatorPipe } from "../../pipes/valueless-operator.pipe";
import { FilterService } from "../../services/filter.service";
import {
    filterMenuActionsThemeVariants,
    filterMenuBaseThemeVariants,
    filterMenuItemThemeVariants,
    type FilterMenuVariantInput,
    type FilterMenuVariantProps
} from "../../styles/filter.styles";

const operatorFilter = new OperatorFilterPipe();
const valuelessOperator = new ValuelessOperatorPipe();

/**
 * Builds a filter for one field from up to two conditions joined by AND or OR. The first condition starts at the
 * first allowed operator; Enter in a value applies, as does the Apply button.
 */
@Component({
    selector: "mona-filter-menu",
    templateUrl: "./filter-menu.component.html",
    imports: [
        DropdownListComponent,
        FormsModule,
        TextBoxComponent,
        NumericTextBoxComponent,
        DatePickerComponent,
        ButtonGroupComponent,
        ButtonDirective,
        ValuelessOperatorPipe
    ],
    providers: [FilterService],
    host: {
        "[class]": "baseClass()"
    }
})
export class FilterMenuComponent implements FilterMenuVariantInput {
    readonly #filterService = inject(FilterService);
    readonly #i18n = inject(MonaI18nService);
    #booleanFilterValues: [boolean | null, boolean | null] = [null, null];
    /** Whether each condition's operator was picked or loaded, rather than defaulted. */
    #chosenOperators: [boolean, boolean] = [false, false];
    protected readonly applyDisabled = computed(() => {
        if (!this.firstFilterValid()) {
            return true;
        }
        return !!(this.selectedConnectorItem() && !this.secondFilterValid());
    });
    protected readonly baseClass = computed(() => {
        return filterMenuBaseThemeVariants();
    });
    protected readonly connectorDataItems = computed<FilterMenuConnectorItem[]>(() => [
        { text: this.messages().and, value: "and" },
        { text: this.messages().or, value: "or" }
    ]);
    protected readonly dateFilterValues = signal<[Date | null, Date | null]>([null, null]);
    protected readonly filterMenuActionsClass = computed(() => {
        return filterMenuActionsThemeVariants();
    });
    protected readonly filterMenuItemClass = computed(() => {
        return filterMenuItemThemeVariants();
    });
    protected readonly firstFilterValid = computed(() => this.#conditionValid(0));
    protected readonly messages = this.#i18n.componentMessages("filter", FILTER_DEFAULT_MESSAGES);
    protected readonly numberFilterValues = signal<[number | null, number | null]>([null, null]);
    /** The operators of the menu's type that `operators` allows, in its order; labels follow the locale. */
    protected readonly operatorItems = computed<FilterMenuDataItem[]>(() => {
        let items: FilterMenuDataItem[];
        switch (this.type()) {
            case "string":
                items = this.#filterService.stringFilterMenuItems;
                break;
            case "number":
                items = this.#filterService.numericFilterMenuItems;
                break;
            case "date":
                items = this.#filterService.dateFilterMenuItems;
                break;
            case "boolean":
                items = this.#filterService.booleanFilterMenuItems;
                break;
            default:
                items = [];
        }
        return operatorFilter.transform(items, this.operators());
    });
    protected readonly secondFilterValid = computed(() => this.#conditionValid(1));
    protected readonly selectedConnectorItem = signal<FilterMenuConnectorItem | null>(null);
    protected readonly selectedFilterMenuDataItemList = signal<Array<FilterMenuDataItem | undefined>>([
        undefined,
        undefined
    ]);
    protected readonly stringFilterValues = signal<[string, string]>(["", ""]);

    public readonly apply = output<CompositeFilterDescriptor>();

    /**
     * @description Options of the date input. Without a `format`, the date picker uses the locale's date format.
     * @default {}
     */
    public readonly dateOptions = input<FilterMenuDateOptions>({});

    /**
     * @description The field the filter applies to.
     * @default ""
     */
    public readonly field = input("");

    /**
     * @description The operators offered, in this order; all of the type's operators when empty.
     * @default []
     */
    public readonly operators = input<Iterable<FilterOperators>>([]);
    public readonly rounded = input<FilterMenuVariantProps["rounded"]>("medium");
    public readonly size = input<FilterMenuVariantProps["size"]>("medium");

    /**
     * @description The data type of the field, which picks the operators and the value input.
     * @default "string"
     */
    public readonly type = input<DataType>("string");

    /**
     * @description The conditions shown in the menu. Setting it to `undefined` clears the menu.
     */
    public readonly value = model<FilterMenuValue>();

    public constructor() {
        effect(() => {
            const value = this.value();
            untracked(() => {
                if (value) {
                    this.setFilterValues(value);
                } else {
                    this.#resetConditions();
                }
            });
        });
        // Keep a chosen operator while it is still allowed (its label follows the locale); any other condition
        // starts at the first allowed operator.
        effect(() => {
            const items = this.operatorItems();
            const connector = this.selectedConnectorItem();
            const current = this.selectedFilterMenuDataItemList();
            untracked(() => {
                const match = (index: 0 | 1): FilterMenuDataItem | undefined => {
                    const item = current[index];
                    return item == null || !this.#chosenOperators[index]
                        ? undefined
                        : items.find(candidate => candidate.value === item.value);
                };
                const first = match(0) ?? items[0];
                const second = connector == null ? undefined : (match(1) ?? items[0]);
                if (first !== current[0] || second !== current[1]) {
                    this.selectedFilterMenuDataItemList.set([first, second]);
                }
            });
        });
        effect(() => {
            const connectors = this.connectorDataItems();
            untracked(() => {
                const current = this.selectedConnectorItem();
                if (current == null) {
                    return;
                }
                const next = connectors.find(connector => connector.value === current.value) ?? null;
                if (next != null && next.text !== current.text) {
                    this.selectedConnectorItem.set(next);
                }
            });
        });
    }

    public getFilterValues(): FilterMenuValue {
        type TargetType = string | number | Date | boolean | null;
        const filterValue = (target: [TargetType, TargetType]) => {
            return {
                operator1: this.selectedFilterMenuDataItemList()[0]?.value,
                value1: target[0],
                logic: this.selectedConnectorItem()?.value,
                operator2: this.selectedFilterMenuDataItemList()[1]?.value,
                value2: target[1]
            };
        };

        switch (this.type()) {
            case "string": {
                const [value1, value2] = this.stringFilterValues();
                return filterValue([value1.trim(), value2.trim()]);
            }
            case "number":
                return filterValue(this.numberFilterValues());
            case "date":
                return filterValue(this.dateFilterValues());
            case "boolean":
                return filterValue(this.#booleanFilterValues);
            default:
                return {
                    operator1: undefined,
                    value1: null,
                    logic: undefined,
                    operator2: undefined,
                    value2: null
                };
        }
    }

    protected onConnectorChange(item: FilterMenuConnectorItem, selected: boolean): void {
        if (selected) {
            this.selectedConnectorItem.set(item);
        } else if (item.value === this.selectedConnectorItem()?.value) {
            this.selectedConnectorItem.set(null);
        }
    }

    protected onFilterApply(): void {
        if (this.applyDisabled()) {
            return;
        }
        if (!this.selectedConnectorItem()) {
            this.clearSecondFilterValues();
        }
        if (this.type() === "string") {
            this.applyStringFilters();
        } else if (this.type() === "number") {
            this.applyNumberFilters();
        } else if (this.type() === "date") {
            this.applyDateFilters();
        } else if (this.type() === "boolean") {
            this.applyBooleanFilters();
        }
    }

    protected onFilterClear(): void {
        this.#resetConditions();
        this.apply.emit({
            logic: "and",
            filters: []
        });
    }

    protected onFilterOperatorChange(index: 0 | 1, item: FilterMenuDataItem): void {
        this.#chosenOperators[index] = true;
        this.selectedFilterMenuDataItemList.update(list => {
            const next = [...list];
            next[index] = item;
            return next;
        });
    }

    /** Enter in a value applies the filter, unless an IME is composing text. */
    protected onValueKeydown(event: KeyboardEvent): void {
        if (event.key !== "Enter" || event.isComposing || event.keyCode === 229) {
            return;
        }
        event.preventDefault();
        this.onFilterApply();
    }

    /** Whether a condition is complete: valueless operators need no value; text must not be blank. */
    #conditionValid(index: 0 | 1): boolean {
        const operator = this.selectedFilterMenuDataItemList()[index]?.value;
        if (!operator) {
            return false;
        }
        if (valuelessOperator.transform(operator)) {
            return true;
        }
        switch (this.type()) {
            case "string":
                return this.stringFilterValues()[index].trim() !== "";
            case "number":
                return this.numberFilterValues()[index] !== null;
            case "date":
                return this.dateFilterValues()[index] !== null;
            case "boolean":
                return true;
            default:
                return false;
        }
    }

    #resetConditions(): void {
        this.numberFilterValues.set([null, null]);
        this.stringFilterValues.set(["", ""]);
        this.dateFilterValues.set([null, null]);
        this.#booleanFilterValues = [null, null];
        this.selectedConnectorItem.set(null);
        this.#chosenOperators = [false, false];
        this.selectedFilterMenuDataItemList.set([this.operatorItems()[0], undefined]);
    }

    private applyBooleanFilters(): void {
        const operator1 = this.selectedFilterMenuDataItemList()[0]?.value as BooleanFilterOperators;
        const operator2 = this.selectedFilterMenuDataItemList()[1]?.value as BooleanFilterOperators;
        const field = this.field();
        const logic = this.selectedConnectorItem()?.value ?? null;
        const descriptor = this.#filterService.buildBooleanFilterDescriptor({
            field,
            logic,
            operator1,
            operator2,
            value1: true,
            value2: true
        });

        this.apply.emit(descriptor);
    }

    private applyDateFilters(): void {
        const value1 = this.dateFilterValues()[0];
        const value2 = this.dateFilterValues()[1];
        const operator1 = this.selectedFilterMenuDataItemList()[0]?.value as DateFilterOperators;
        const operator2 = this.selectedFilterMenuDataItemList()[1]?.value as DateFilterOperators;
        const field = this.field();
        const logic = this.selectedConnectorItem()?.value ?? null;
        const descriptor = this.#filterService.buildDateFilterDescriptor({
            field,
            logic,
            operator1,
            operator2,
            value1,
            value2
        });

        this.apply.emit(descriptor);
    }

    private applyNumberFilters(): void {
        const value1 = this.numberFilterValues()[0];
        const value2 = this.numberFilterValues()[1];
        const operator1 = this.selectedFilterMenuDataItemList()[0]?.value as NumericFilterOperators;
        const operator2 = this.selectedFilterMenuDataItemList()[1]?.value as NumericFilterOperators;
        const field = this.field();
        const logic = this.selectedConnectorItem()?.value ?? null;

        const descriptor = this.#filterService.buildNumberFilterDescriptor({
            field,
            logic,
            operator1,
            operator2,
            value1,
            value2
        });
        this.apply.emit(descriptor);
    }

    private applyStringFilters(): void {
        const value1 = this.stringFilterValues()[0].trim();
        const value2 = this.stringFilterValues()[1].trim();
        const operator1 = this.selectedFilterMenuDataItemList()[0]?.value as StringFilterOperators;
        const operator2 = this.selectedFilterMenuDataItemList()[1]?.value as StringFilterOperators;
        const field = this.field();
        const logic = this.selectedConnectorItem()?.value ?? null;
        const descriptor = this.#filterService.buildStringFilterDescriptor({
            field,
            logic,
            operator1,
            operator2,
            value1,
            value2
        });
        this.apply.emit(descriptor);
    }

    private clearSecondFilterValues(): void {
        this.#chosenOperators[1] = false;
        this.selectedFilterMenuDataItemList.set([this.selectedFilterMenuDataItemList()[0], undefined]);
        switch (this.type()) {
            case "string":
                this.stringFilterValues.set([this.stringFilterValues()[0], ""]);
                break;
            case "number":
                this.numberFilterValues.set([this.numberFilterValues()[0], null]);
                break;
            case "date":
                this.dateFilterValues.set([this.dateFilterValues()[0], null]);
                break;
            case "boolean":
                this.#booleanFilterValues[1] = null;
                break;
            default:
                break;
        }
    }

    private setFilterValues(values: FilterMenuValue): void {
        const items = this.operatorItems();
        this.#chosenOperators = [values.operator1 != null, values.operator2 != null];
        this.selectedFilterMenuDataItemList.set([
            items.find(f => f.value === values.operator1) ?? items[0],
            items.find(f => f.value === values.operator2) ?? undefined
        ]);

        // Values the menu's inputs can't show are left empty.
        const { value1, value2 } = values;
        switch (this.type()) {
            case "string": {
                const text = (value: unknown): string => (value == null ? "" : String(value));
                this.stringFilterValues.set([text(value1), text(value2)]);
                break;
            }
            case "number": {
                const num = (value: unknown): number | null => (typeof value === "number" ? value : null);
                this.numberFilterValues.set([num(value1), num(value2)]);
                break;
            }
            case "date": {
                // A date from saved state may be text or a time stamp.
                const date = (value: unknown): Date | null => {
                    if (value instanceof Date) {
                        return value;
                    }
                    if (typeof value !== "string" && typeof value !== "number") {
                        return null;
                    }
                    const parsed = new Date(value);
                    return Number.isNaN(parsed.getTime()) ? null : parsed;
                };
                this.dateFilterValues.set([date(value1), date(value2)]);
                break;
            }
            case "boolean": {
                const bool = (value: unknown): boolean | null => (typeof value === "boolean" ? value : null);
                this.#booleanFilterValues = [bool(value1), bool(value2)];
                break;
            }
            default:
                break;
        }

        const selectedConnectorItem =
            values.operator2 && values.logic
                ? (this.connectorDataItems().find(c => c.value === values.logic) ?? null)
                : null;
        this.selectedConnectorItem.set(selectedConnectorItem);
    }
}
