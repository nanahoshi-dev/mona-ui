import { Component, computed, effect, inject, input, model, output, signal, untracked } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { ButtonGroupComponent } from "@nanahoshi/mona-ui/button-group";
import { DataType } from "@nanahoshi/mona-ui/common";
import { DatePickerComponent } from "@nanahoshi/mona-ui/date-picker";
import { DropdownListComponent } from "@nanahoshi/mona-ui/dropdown-list";
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
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import { FilterMenuConnectorItem } from "../../models/FilterMenuConnectorItem";
import { FilterMenuDataItem } from "../../models/FilterMenuDataItem";
import type { FilterMenuDateOptions, FilterMenuDateType } from "../../models/FilterMenuDateOptions";
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
        ValuelessOperatorPipe,
        OperatorFilterPipe
    ],
    host: {
        "[class]": "baseClass()"
    }
})
export class FilterMenuComponent implements FilterMenuVariantInput {
    #booleanFilterValues: [boolean | null, boolean | null] = [null, null];
    readonly #filterService = inject(FilterService);
    readonly #themeService = inject(ThemeService);
    protected readonly applyDisabled = computed(() => {
        if (!this.firstFilterValid()) {
            return true;
        }
        return !!(this.selectedConnectorItem() && !this.secondFilterValid());
    });
    protected readonly baseClass = computed(() => {
        const theme = this.#themeService.theme();
        return filterMenuBaseThemeVariants(theme)();
    });
    protected readonly booleanFilterMenuDataItems = this.#filterService.booleanFilterMenuItems;
    protected readonly connectorDataItems: FilterMenuConnectorItem[] = [
        { text: "AND", value: "and" },
        { text: "OR", value: "or" }
    ];
    protected readonly dateFilterMenuDataItems = this.#filterService.dateFilterMenuItems;
    protected readonly dateFilterValues = signal<[Date | null, Date | null]>([null, null]);
    protected readonly effectiveDateOptions = computed(() => {
        const type = this.type();
        const dateOptions = this.dateOptions();
        if (type !== "date") {
            return dateOptions;
        }
        if (dateOptions.type === type) {
            return dateOptions;
        }
        return {
            format: this.getDefaultDateFormat(type),
            type
        };
    });
    protected readonly filterMenuActionsClass = computed(() => {
        const theme = this.#themeService.theme();
        return filterMenuActionsThemeVariants(theme)();
    });
    protected readonly filterMenuItemClass = computed(() => {
        const theme = this.#themeService.theme();
        return filterMenuItemThemeVariants(theme)();
    });
    protected readonly firstFilterValid = computed(() => {
        const operator = this.selectedFilterMenuDataItemList()[0]?.value;
        const type = this.type();
        const stringFilterValues = this.stringFilterValues();
        const numberFilterValues = this.numberFilterValues();
        const dateFilterValues = this.dateFilterValues();
        if (!operator) {
            return false;
        }
        if (operator === "isnull" || operator === "isnotnull") {
            return true;
        }
        switch (type) {
            case "string":
                if (
                    operator === "isempty" ||
                    operator === "isnotempty" ||
                    operator === "isnullorempty" ||
                    operator === "isnotnullorempty"
                ) {
                    return true;
                }
                return stringFilterValues[0] !== "";
            case "number":
                return numberFilterValues[0] !== null;
            case "date":
                return dateFilterValues[0] !== null;
            case "boolean":
                return true;
            default:
                return false;
        }
    });
    protected readonly numberFilterValues = signal<[number | null, number | null]>([null, null]);
    protected readonly numericFilterMenuDataItems = this.#filterService.numericFilterMenuItems;
    protected readonly secondFilterValid = computed(() => {
        const operator = this.selectedFilterMenuDataItemList()[1]?.value;
        const type = this.type();
        const stringFilterValues = this.stringFilterValues();
        const numberFilterValues = this.numberFilterValues();
        const dateFilterValues = this.dateFilterValues();
        if (!operator) {
            return false;
        }
        if (operator === "isnull" || operator === "isnotnull") {
            return true;
        }
        switch (type) {
            case "string":
                if (
                    operator === "isempty" ||
                    operator === "isnotempty" ||
                    operator === "isnullorempty" ||
                    operator === "isnotnullorempty"
                ) {
                    return true;
                }
                return stringFilterValues[1] !== "";
            case "number":
                return numberFilterValues[1] !== null;
            case "date":
                return dateFilterValues[1] !== null;
            case "boolean":
                return true;
            default:
                return false;
        }
    });
    protected readonly selectedConnectorItem = signal<FilterMenuConnectorItem | null>(null);
    protected readonly selectedFilterMenuDataItemList = signal<Array<FilterMenuDataItem | undefined>>([
        undefined,
        undefined
    ]);
    protected readonly stringFilterMenuDataItems = this.#filterService.stringFilterMenuItems;
    protected readonly stringFilterValues = signal<[string, string]>(["", ""]);

    public readonly apply = output<CompositeFilterDescriptor>();
    public readonly dateOptions = input<FilterMenuDateOptions>({
        format: "dd/MM/yyyy",
        type: "date"
    });
    public readonly field = model("");
    public readonly operators = model<Iterable<FilterOperators>>([]);
    public readonly rounded = input<FilterMenuVariantProps["rounded"]>("medium");
    public readonly size = input<FilterMenuVariantProps["size"]>("medium");
    public readonly type = model<DataType>("string");
    public readonly value = model<FilterMenuValue>();

    public constructor() {
        effect(() => {
            const value = this.value();
            if (value) {
                untracked(() => {
                    this.setFilterValues(value);
                });
            }
        });
    }

    protected onConnectorChange(item: FilterMenuConnectorItem, selected: boolean): void {
        if (selected) {
            this.selectedConnectorItem.set(item);
        } else if (item.value === this.selectedConnectorItem()?.value) {
            this.selectedConnectorItem.set(null);
        }
    }

    protected onFilterApply(): void {
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
        this.numberFilterValues.set([null, null]);
        this.stringFilterValues.set(["", ""]);
        this.dateFilterValues.set([null, null]);
        this.#booleanFilterValues = [null, null];
        this.selectedFilterMenuDataItemList.set([undefined, undefined]);
        this.selectedConnectorItem.set(null);
        this.apply.emit({
            logic: "and",
            filters: []
        });
    }

    protected onFilterOperatorChange(index: number, item: FilterMenuDataItem): void {
        this.selectedFilterMenuDataItemList.update(list => {
            list[index] = item;
            return [...list];
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
            case "string":
                return filterValue(this.stringFilterValues());
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
        const value1 = this.stringFilterValues()[0];
        const value2 = this.stringFilterValues()[1];
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
        type TargetType = string | number | Date | boolean | null;
        let filterMenuDataItems: FilterMenuDataItem[];
        let filterValues: [TargetType, TargetType];

        switch (this.type()) {
            case "string":
                filterMenuDataItems = this.stringFilterMenuDataItems;
                filterValues = [values.value1 ?? "", values.value2 ?? ""];
                break;
            case "number":
                filterMenuDataItems = this.numericFilterMenuDataItems;
                filterValues = [values.value1 ?? null, values.value2 ?? null];
                break;
            case "date":
            case "boolean":
                filterMenuDataItems =
                    this.type() !== "boolean" ? this.dateFilterMenuDataItems : this.booleanFilterMenuDataItems;
                filterValues = [values.value1 ?? null, values.value2 ?? null];
                break;
            default:
                filterMenuDataItems = [];
                filterValues = [null, null];
                break;
        }

        this.selectedFilterMenuDataItemList.set([
            filterMenuDataItems.find(f => f.value === values.operator1) ?? undefined,
            filterMenuDataItems.find(f => f.value === values.operator2) ?? undefined
        ]);

        switch (this.type()) {
            case "string":
                this.stringFilterValues.set(filterValues as [string, string]);
                break;
            case "number":
                this.numberFilterValues.set(filterValues as [number, number]);
                break;
            case "date":
                this.dateFilterValues.set(filterValues as [Date, Date]);
                break;
            case "boolean":
                this.#booleanFilterValues = filterValues as [boolean, boolean];
                break;
            default:
                break;
        }

        const selectedConnectorItem =
            values.operator2 && values.logic
                ? (this.connectorDataItems.find(c => c.value === values.logic) ?? null)
                : null;
        this.selectedConnectorItem.set(selectedConnectorItem);
    }

    private getDefaultDateFormat(type: FilterMenuDateType): string {
        switch (type) {
            case "datetime":
                return "dd/MM/yyyy HH:mm";
            case "time":
                return "HH:mm";
            case "date":
                return "dd/MM/yyyy";
            default:
                return "dd/MM/yyyy";
        }
    }
}
