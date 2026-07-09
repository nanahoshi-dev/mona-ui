import { CurrencyPipe, NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, input, model, signal } from "@angular/core";
import { disabled, form, FormField, readonly, required } from "@angular/forms/signals";
import { LucideBox, LucideSearch } from "@lucide/angular";
import { ComboBoxComponent } from "@nanahoshi/mona-ui/combo-box";
import { FilterableOptions, VirtualScrollOptions } from "@nanahoshi/mona-ui/common";
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
} from "@nanahoshi/mona-ui/dropdowns";
import { GroupableOptions } from "@nanahoshi/mona-ui/internal/list";
import { ImmutableSet, range } from "@mirei/ts-collections";
import { dropdownFoodData } from "../../../../assets/dropdown.data";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import {
    dropdownDataSetFeatureConfig,
    dropdownFilteringFeatureConfig,
    dropdownFooterTemplateFeatureConfig,
    dropdownGroupingFeatureConfig,
    dropdownHeaderTemplateFeatureConfig,
    dropdownItemTemplateFeatureConfig,
    dropdownNoDataTemplateFeatureConfig,
    dropdownPrefixTemplateFeatureConfig,
    dropdownVirtualizationFeatureConfig,
    getFormValueText
} from "../../utils/dropdownFeatureConfigs";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-combo-box-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./combo-box-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComboBoxDemoComponent extends AbstractDemoComponent<ComboBoxComponent> {
    readonly #injector = createFeatureInjector({
        dataSet: dropdownDataSetFeatureConfig("combo box"),
        filtering: dropdownFilteringFeatureConfig("combo box"),
        footerTemplate: dropdownFooterTemplateFeatureConfig("combo box"),
        grouping: dropdownGroupingFeatureConfig("combo box"),
        headerTemplate: dropdownHeaderTemplateFeatureConfig("combo box"),
        itemTemplate: dropdownItemTemplateFeatureConfig("combo box"),
        noDataTemplate: dropdownNoDataTemplateFeatureConfig("combo box"),
        prefixTemplate: dropdownPrefixTemplateFeatureConfig("combo box"),
        virtualization: dropdownVirtualizationFeatureConfig("combo box")
    });
    protected readonly config = signal<ComponentConfig<ComboBoxComponent>>({
        code: ``,
        inputs: {
            allowCustomValue: {
                type: "boolean",
                value: false
            },
            data: {
                type: "iterable",
                value: []
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
                value: ""
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
    protected readonly metadata = this.getMetadata("ComboBoxComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
    protected readonly ComboBoxWrapperComponent = ComboBoxWrapperComponent;
}

@Component({
    imports: [
        ComboBoxComponent,
        DropdownVirtualScrollDirective,
        DropdownNoDataTemplateDirective,
        DropdownPrefixTemplateDirective,
        DropdownFooterTemplateDirective,
        DropdownHeaderTemplateDirective,
        DropdownGroupHeaderTemplateDirective,
        DropdownGroupableDirective,
        DropdownFilterableDirective,
        CurrencyPipe,
        DropdownItemTemplateDirective,
        LucideBox,
        LucideSearch,
        FormField
    ],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        @let featureData = features();
        @let groupingFeatures = featureData["grouping"]?.subFeatures || {};
        <span>Selected Value: {{ formValueText() }}</span>
        <mona-combo-box
            [allowCustomValue]="allowCustomValue()"
            [data]="comboBoxData()"
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
            [monaDropDownGroupable]="grouping()"
            [monaDropDownFilterable]="filtering()"
            [monaDropDownVirtualScroll]="virtualization()"
            [formField]="form.value"
            [groupBy]="groupBy()"
            (valueAdd)="onValueAdd($event)"
            class="w-50">
            @if (featureData["footerTemplate"].active) {
                <ng-template monaDropDownFooterTemplate>
                    <div class="p-2 bg-accent text-foreground border-t border-t-border font-semibold">
                        Total items: {{ comboBoxData().length }}
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
                    <svg lucideSearch [size]="16" class="h-full ml-1"></svg>
                </ng-template>
            }
        </mona-combo-box>
    `
})
class ComboBoxWrapperComponent implements ComponentInputsAsSignal<ComboBoxComponent> {
    readonly #comboBoxData = signal(ImmutableSet.create(dropdownFoodData));
    readonly #comboBoxVirtualData = signal(
        range(1, 10000)
            .select(i => {
                const item = dropdownFoodData[i % dropdownFoodData.length];
                return { ...item, value: i, text: `${i} / ${item.text}` };
            })
            .toImmutableSet()
    );
    readonly #formModel = signal<ComboBoxFormModel>({ value: null });
    protected readonly comboBoxData = computed(() => {
        const dataSet = this.features()["dataSet"].dropdownValue;
        if (dataSet === "Empty") {
            return ImmutableSet.create<(typeof dropdownFoodData)[0]>();
        }
        const virtualization = this.virtualization();
        if (!virtualization.enabled) {
            return this.#comboBoxData();
        }
        return this.#comboBoxVirtualData();
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
    public readonly allowCustomValue = model<ReturnType<ComboBoxComponent["allowCustomValue"]>>(false);
    public readonly data = input<ReturnType<ComboBoxComponent["data"]>>([]);
    public readonly disabled = model<ReturnType<ComboBoxComponent["disabled"]>>(false);
    public readonly itemDisabled = input<ReturnType<ComboBoxComponent["itemDisabled"]>>(null);
    public readonly loading = model<ReturnType<ComboBoxComponent["loading"]>>(false);
    public readonly placeholder = input<ReturnType<ComboBoxComponent["placeholder"]>>("");
    public readonly popupClass = input<ReturnType<ComboBoxComponent["popupClass"]>>("");
    public readonly popupHeight = input<ReturnType<ComboBoxComponent["popupHeight"]>>(null);
    public readonly popupWidth = input<ReturnType<ComboBoxComponent["popupWidth"]>>(null);
    public readonly readonly = model<ReturnType<ComboBoxComponent["readonly"]>>(false);
    public readonly required = model<ReturnType<ComboBoxComponent["required"]>>(false);
    public readonly rounded = input<ReturnType<ComboBoxComponent["rounded"]>>("medium");
    public readonly showClearButton = input<ReturnType<ComboBoxComponent["showClearButton"]>>(false);
    public readonly size = input<ReturnType<ComboBoxComponent["size"]>>("medium");
    public readonly textField = input<ReturnType<ComboBoxComponent["textField"]>>("text");
    public readonly valueField = input<ReturnType<ComboBoxComponent["valueField"]>>("value");

    protected onValueAdd(value: string): void {
        const newItem: (typeof dropdownFoodData)[0] = {
            active: true,
            category: "Custom",
            price: Math.random() * 10,
            text: value,
            value: Math.random(),
            image: "",
            origin: "Unknown"
        };
        this.#comboBoxData.update(set => set.add(newItem));
        this.form.value().value.set(newItem);
    }
}

interface ComboBoxFormModel {
    value: (typeof dropdownFoodData)[0] | null;
}
