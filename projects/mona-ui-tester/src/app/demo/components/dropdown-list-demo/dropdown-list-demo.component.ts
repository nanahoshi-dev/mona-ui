import { CurrencyPipe, NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, input, model, signal } from "@angular/core";
import { disabled, form, FormField, readonly, required } from "@angular/forms/signals";
import { LucideBox, LucideUtensils } from "@lucide/angular";
import { FilterableOptions, PreventableEvent, VirtualScrollOptions } from "@mirei/mona-ui/common";
import { DropdownListComponent, DropdownListValueTemplateDirective } from "@mirei/mona-ui/dropdown-list";
import {
    DropdownFilterableDirective,
    DropdownFooterTemplateDirective,
    DropdownGroupableDirective,
    DropdownGroupHeaderTemplateDirective,
    DropdownHeaderTemplateDirective,
    DropdownItemTemplateDirective,
    DropdownNoDataTemplateDirective,
    DropdownPrefixTemplateDirective,
    DropdownVirtualScrollDirective
} from "@mirei/mona-ui/dropdowns";
import { GroupableOptions } from "@mirei/mona-ui/internal/list";
import { range } from "@mirei/ts-collections";
import { dropdownFoodData } from "../../../../assets/dropdown.data";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import {
    dropdownDataSetFeatureConfig,
    dropdownFilteringFeatureConfig,
    dropdownGroupingFeatureConfig,
    dropdownNoDataTemplateFeatureConfig,
    dropdownPrefixTemplateFeatureConfig,
    dropdownVirtualizationFeatureConfig,
    getFormValueText
} from "../../utils/dropdownFeatureConfigs";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-dropdown-list-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./dropdown-list-demo.component.html"
})
export class DropdownListDemoComponent extends AbstractDemoComponent<DropdownListComponent> {
    readonly #injector = createFeatureInjector({
        dataSet: dropdownDataSetFeatureConfig("autocomplete"),
        filtering: dropdownFilteringFeatureConfig("dropdown"),
        footerTemplate: {
            active: false,
            code: ``,
            description: `This template is used to customize the footer template of the dropdown list.`,
            name: "Footer Template"
        },
        grouping: dropdownGroupingFeatureConfig("dropdown"),
        headerTemplate: {
            active: false,
            code: ``,
            description: `This template is used to customize the header template of the dropdown list.`,
            name: "Header Template"
        },
        itemTemplate: {
            active: false,
            code: ``,
            description: `This template is used to customize the item template of the dropdown list.`,
            name: "Item Template"
        },
        noDataTemplate: dropdownNoDataTemplateFeatureConfig("autocomplete"),
        prefixTemplate: dropdownPrefixTemplateFeatureConfig("dropdown"),
        preventClose: {
            active: false,
            code: ``,
            description: `The "close" event is fired when the popup is about to close.`,
            name: "Prevent Close"
        },
        preventOpen: {
            active: false,
            code: ``,
            description: `The "open" event is fired when the popup is about to open.`,
            name: "Prevent Open"
        },
        valueTemplate: {
            active: false,
            code: ``,
            description: `This template is used to customize the value template of the dropdown list.`,
            name: "Value Template"
        },
        virtualization: dropdownVirtualizationFeatureConfig("dropdown")
    });
    protected readonly config = signal<ComponentConfig<DropdownListComponent<any>>>({
        code: ``,
        inputs: {
            data: {
                type: "object"
            },
            disabled: {
                type: "boolean",
                value: false
            },
            itemDisabled: {
                type: "dropdown",
                value: ["active", (item: any) => item.price > 5, (item: any) => item.price < 5],
                defaultValue: null,
                clearable: true,
                placeholder: "Select a condition..."
            },
            loading: {
                type: "boolean",
                value: false
            },
            placeholder: {
                type: "string",
                value: "Select an option"
            },
            popupClass: {
                type: "string",
                value: ""
            },
            popupHeight: {
                type: "number",
                nullable: true,
                min: 0,
                max: 500,
                value: null
            },
            popupWidth: {
                type: "number",
                nullable: true,
                min: 0,
                value: null
            },
            readonly: {
                type: "boolean",
                value: false
            },
            required: {
                type: "boolean",
                value: false
            },
            rounded: {
                type: "dropdown",
                value: ["none", "small", "medium", "large", "full"],
                defaultValue: "medium"
            },
            showClearButton: {
                type: "boolean",
                value: false
            },
            size: {
                type: "dropdown",
                value: ["medium", "small", "large"],
                defaultValue: "medium"
            },
            textField: {
                type: "string",
                value: "text"
            },
            valueField: {
                type: "string",
                value: "value"
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("DropdownListComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([
        "DropdownFilterableDirective",
        "DropdownGroupableDirective"
    ]);
    protected readonly DropdownListWrapperComponent = DropdownListWrapperComponent;
}

@Component({
    imports: [
        DropdownListComponent,
        DropdownFilterableDirective,
        DropdownGroupableDirective,
        DropdownHeaderTemplateDirective,
        DropdownFooterTemplateDirective,
        DropdownListValueTemplateDirective,
        DropdownItemTemplateDirective,
        DropdownGroupHeaderTemplateDirective,
        DropdownVirtualScrollDirective,
        CurrencyPipe,
        DropdownNoDataTemplateDirective,
        DropdownPrefixTemplateDirective,
        FormField,
        LucideBox,
        LucideUtensils
    ],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        @let featureData = features();
        @let groupingFeatures = featureData["grouping"]?.subFeatures || {};
        <span>Selected Value: {{ formValueText() }}</span>
        <mona-dropdown-list
            [data]="dropdownData()"
            [itemDisabled]="itemDisabled()"
            [loading]="loading()"
            [placeholder]="placeholder()"
            [popupClass]="popupClass()"
            [popupHeight]="popupHeight()"
            [popupWidth]="popupWidth()"
            [rounded]="rounded()"
            [showClearButton]="showClearButton()"
            [size]="size()"
            [textField]="textField()"
            [valueField]="valueField()"
            [formField]="form.value"
            [monaDropDownGroupable]="grouping()"
            [monaDropDownFilterable]="filtering()"
            [monaDropDownVirtualScroll]="virtualization()"
            [groupBy]="groupBy()"
            (close)="onPopupClose($event)"
            (open)="onPopupOpen($event)"
            class="w-44">
            @if (featureData["footerTemplate"].active) {
                <ng-template monaDropDownFooterTemplate>
                    <div class="p-2 bg-accent text-foreground border-t border-t-border font-semibold">
                        Total items: {{ dropdownData().length }}
                    </div>
                </ng-template>
            }
            @if (groupingFeatures["groupHeaderTemplate"]?.active) {
                <ng-template monaDropDownGroupHeaderTemplate let-group>
                    <span class="text-blue-600 font-semibold px-3 py-0.5 underline">Group: {{ group }}</span>
                </ng-template>
            }
            @if (featureData["headerTemplate"].active) {
                <ng-template monaDropDownHeaderTemplate>
                    <div class="p-2 bg-accent text-foreground border-b border-b-border font-semibold">
                        Select your favorite food
                    </div>
                </ng-template>
            }
            @if (featureData["itemTemplate"].active) {
                <ng-template monaDropDownItemTemplate let-item>
                    <div class="flex flex-row w-full">
                        @let color = item.price > 7 ? "text-amber-600" : item.price < 3 ? "text-emerald-700" : "";
                        <span class="flex-1 {{ color }}">{{ item.text }}</span>
                        <span class="inline-flex items-center justify-center invert text-xs text-gray-500">{{
                            item.price | currency
                        }}</span>
                    </div>
                </ng-template>
            }
            @if (featureData["noDataTemplate"].active) {
                <ng-template monaDropDownNoDataTemplate>
                    <div class="flex flex-col items-center select-none justify-center w-full h-full gap-2 opacity-30">
                        <svg lucideBox></svg>
                        <span>No items found</span>
                    </div>
                </ng-template>
            }
            @if (featureData["prefixTemplate"].active) {
                <ng-template monaDropdownPrefixTemplate>
                    <svg lucideUtensils [size]="16" class="h-full aspect-square flex items-center justify-center"></svg>
                </ng-template>
            }
            @if (featureData["valueTemplate"].active) {
                <ng-template monaDropDownListValueTemplate let-item>
                    @if (!item) {
                        <span class="text-gray-500">Select an option...</span>
                    } @else {
                        <span class="text-pink-600 font-bold truncate">{{ item?.text }}</span>
                    }
                </ng-template>
            }
        </mona-dropdown-list>
    `
})
export class DropdownListWrapperComponent implements ComponentInputsAsSignal<DropdownListComponent> {
    readonly #formModel = signal<DropdownListFormModel>({ value: null });
    protected readonly dropdownData = computed(() => {
        const dataSet = this.features()["dataSet"].dropdownValue;
        if (dataSet === "Empty") {
            return [];
        }
        const virtualization = this.virtualization();
        if (!virtualization.enabled) {
            return dropdownFoodData;
        }
        return range(1, 10000)
            .select(i => {
                const item = dropdownFoodData[i % dropdownFoodData.length];
                return { ...item, value: i, text: `${item.text} ${i}` };
            })
            .toArray();
    });
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly form = form(this.#formModel, schema => {
        disabled(schema.value, { when: () => this.disabled() });
        readonly(schema.value, { when: () => this.readonly() });
        required(schema.value, { when: () => this.required() });
    });
    protected readonly filtering = computed(() => {
        const features = this.features();
        const subFeatures = features["filtering"]?.subFeatures || {};
        const filteringOptions: FilterableOptions = {
            caseSensitive: subFeatures["caseSensitive"].active ?? false,
            debounce: subFeatures["debounce"].numericValue ?? 0,
            enabled: features["filtering"].active ?? false,
            operator: subFeatures["operator"].dropdownValue
        };
        return filteringOptions;
    });
    protected readonly formValueText = computed(() => {
        const value = this.form.value().value();
        const textField = this.textField();
        return getFormValueText(value, textField);
    });
    protected readonly groupBy = computed(() => {
        const features = this.features();
        const subFeatures = features["grouping"]?.subFeatures || {};
        return subFeatures["groupBy"].dropdownValue;
    });
    protected readonly grouping = computed(() => {
        const features = this.features();
        const subFeatures = features["grouping"]?.subFeatures || {};
        const groupingOptions: GroupableOptions = {
            enabled: features["grouping"].active,
            headerOrder: subFeatures["headerOrder"].dropdownValue,
            orderBy: subFeatures["orderBy"].dropdownValue,
            orderByDirection: subFeatures["orderByDirection"].dropdownValue
        };
        return groupingOptions;
    });
    protected readonly virtualization = computed(() => {
        const features = this.features();
        const subFeatures = features["virtualization"]?.subFeatures || {};
        const options: Partial<VirtualScrollOptions> = {
            enabled: features["virtualization"].active,
            height: subFeatures["itemHeight"].numericValue
        };
        return options;
    });
    public readonly data = input<ReturnType<DropdownListComponent["data"]>>([]);
    public readonly disabled = model<ReturnType<DropdownListComponent["disabled"]>>(false);
    public readonly itemDisabled = input<ReturnType<DropdownListComponent["itemDisabled"]>>("active");
    public readonly loading = input<ReturnType<DropdownListComponent["loading"]>>(false);
    public readonly placeholder = input<ReturnType<DropdownListComponent["placeholder"]>>("Select an option");
    public readonly popupClass = input<ReturnType<DropdownListComponent["popupClass"]>>("");
    public readonly popupHeight = input<ReturnType<DropdownListComponent["popupHeight"]>>(null);
    public readonly popupWidth = input<ReturnType<DropdownListComponent["popupWidth"]>>(null);
    public readonly readonly = input<ReturnType<DropdownListComponent["readonly"]>>(false);
    public readonly required = input<ReturnType<DropdownListComponent["required"]>>(false);
    public readonly rounded = input<ReturnType<DropdownListComponent["rounded"]>>("medium");
    public readonly showClearButton = input<ReturnType<DropdownListComponent["showClearButton"]>>(false);
    public readonly size = input<ReturnType<DropdownListComponent["size"]>>("medium");
    public readonly textField = input<ReturnType<DropdownListComponent["textField"]>>("text");
    public readonly valueField = input<ReturnType<DropdownListComponent["valueField"]>>("value");

    protected onPopupClose(event: PreventableEvent) {
        const preventClose = this.features()["preventClose"].active;
        if (preventClose) {
            event.preventDefault();
            console.log("Dropdown List popup prevented from closing");
        }
    }
    protected onPopupOpen(event: PreventableEvent) {
        const preventOpen = this.features()["preventOpen"].active;
        if (preventOpen) {
            event.preventDefault();
            console.log("Dropdown List popup prevented from opening");
        }
    }
}

interface DropdownListFormModel {
    value: (typeof dropdownFoodData)[number] | number | null;
}
