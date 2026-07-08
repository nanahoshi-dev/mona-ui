import { CurrencyPipe, NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, input, model, signal } from "@angular/core";
import { disabled, form, FormField, readonly, required } from "@angular/forms/signals";
import { LucideBox, LucideSearch } from "@lucide/angular";
import { range } from "@mirei/ts-collections";
import {
    MultiSelectComponent,
    MultiSelectSummaryTagDirective,
    MultiSelectSummaryTagTemplateDirective,
    MultiSelectTagTemplateDirective
} from "@mirei/mona-ui/multi-select";
import {
    DropdownFilterableDirective,
    DropdownFooterTemplateDirective,
    DropdownGroupableDirective,
    DropdownHeaderTemplateDirective,
    DropdownItemTemplateDirective,
    DropdownNoDataTemplateDirective,
    DropdownPrefixTemplateDirective,
    DropdownVirtualScrollDirective
} from "@mirei/mona-ui/dropdowns";
import { FilterableOptions, VirtualScrollOptions } from "@mirei/mona-ui/common";
import { GroupableOptions } from "@mirei/mona-ui/internal/list";
import type { PreventableEvent } from "@mirei/mona-ui/common";
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
    dropdownPreventPopupEventFeatureConfig,
    dropdownVirtualizationFeatureConfig,
    getFormValueText
} from "../../utils/dropdownFeatureConfigs";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-multi-select-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./multi-select-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MultiSelectDemoComponent extends AbstractDemoComponent<MultiSelectComponent> {
    readonly #injector = createFeatureInjector({
        dataSet: dropdownDataSetFeatureConfig("multi select"),
        filtering: dropdownFilteringFeatureConfig("multi select"),
        footerTemplate: dropdownFooterTemplateFeatureConfig("multi select"),
        grouping: dropdownGroupingFeatureConfig("multi select"),
        headerTemplate: dropdownHeaderTemplateFeatureConfig("multi select"),
        itemTemplate: dropdownItemTemplateFeatureConfig("multi select"),
        noDataTemplate: dropdownNoDataTemplateFeatureConfig("multi select"),
        prefixTemplate: dropdownPrefixTemplateFeatureConfig("multi select"),
        preventClose: dropdownPreventPopupEventFeatureConfig("close"),
        preventOpen: dropdownPreventPopupEventFeatureConfig("open"),
        summaryTag: {
            code: ``,
            active: false,
            name: "Summary Tag",
            description: "Customizes the summary tag for the multi-select component.",
            subFeatures: {
                tagCount: {
                    code: ``,
                    active: false,
                    name: "Tag Count",
                    description: "The number of selected items to display in the summary tag.",
                    type: "number",
                    numericMin: -1,
                    numericValue: 3
                },
                tagTemplate: {
                    code: ``,
                    active: false,
                    name: "Tag Template",
                    description: "Customizes the summary tag for the multi-select component."
                }
            }
        },
        tagTemplate: {
            code: ``,
            active: false,
            name: "Tag Template",
            description: "Customizes the tag for the multi-select component."
        },
        virtualization: dropdownVirtualizationFeatureConfig("multi select")
    });
    protected readonly config = signal<ComponentConfig<MultiSelectComponent>>({
        code: ``,
        inputs: {
            autoClose: {
                type: "boolean",
                value: false
            },
            checkboxes: {
                type: "boolean",
                value: false
            },
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
    protected readonly metadata = this.getMetadata("MultiSelectComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
    protected readonly MultiSelectWrapperComponent = MultiSelectWrapperComponent;
}

@Component({
    imports: [
        MultiSelectComponent,
        DropdownVirtualScrollDirective,
        DropdownFooterTemplateDirective,
        DropdownHeaderTemplateDirective,
        CurrencyPipe,
        DropdownItemTemplateDirective,
        DropdownNoDataTemplateDirective,
        DropdownPrefixTemplateDirective,
        DropdownFilterableDirective,
        MultiSelectSummaryTagTemplateDirective,
        MultiSelectSummaryTagDirective,
        MultiSelectTagTemplateDirective,
        DropdownGroupableDirective,
        LucideBox,
        LucideSearch,
        FormField
    ],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        @let featureData = features();
        @let tagConfigData = tagConfig();
        <span>Selected Items: {{ formValueText() }}</span>
        <mona-multi-select
            [autoClose]="autoClose()"
            [checkboxes]="checkboxes()"
            [data]="multiSelectData()"
            [itemDisabled]="itemDisabled()"
            [loading]="loading()"
            [popupClass]="popupClass()"
            [popupHeight]="popupHeight()"
            [popupWidth]="popupWidth()"
            [rounded]="rounded()"
            [showClearButton]="showClearButton()"
            [size]="size()"
            [textField]="textField()"
            [valueField]="valueField()"
            [monaDropDownFilterable]="filtering()"
            [monaDropDownGroupable]="grouping()"
            [monaDropDownVirtualScroll]="virtualization()"
            [monaMultiSelectSummaryTag]="tagConfigData.count"
            [formField]="form.value"
            [groupBy]="groupBy()"
            (close)="onPopupClose($event)"
            (closed)="onPopupClosed()"
            (open)="onPopupOpen($event)"
            (opened)="onPopupOpened()"
            class="w-60">
            @if (featureData["footerTemplate"].active) {
                <ng-template monaDropDownFooterTemplate>
                    <div class="p-2 bg-accent text-foreground border-t border-t-border font-semibold">
                        Total items: {{ multiSelectData().length }}
                    </div>
                </ng-template>
            }
            @if (featureData["headerTemplate"].active) {
                <ng-template monaDropDownHeaderTemplate>
                    <div class="p-2 bg-accent text-foreground border-b border-b-border font-semibold">
                        Select your favorite foods
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
                    <svg lucideSearch [size]="16" class="h-full ms-1"></svg>
                </ng-template>
            }
            @if (tagConfigData.template) {
                <ng-template monaMultiSelectSummaryTagTemplate let-items let-tagCount="tagCount">
                    @let prefix = tagCount !== 0 ? "and" : "";
                    <span class="text-blue-400"> {{ prefix }} {{ items.length - tagCount }} more... </span>
                </ng-template>
            }
            @if (featureData["tagTemplate"].active) {
                <ng-template monaMultiSelectTagTemplate let-item>
                    <span class="italic text-violet-600">{{ item.text }}</span>
                </ng-template>
            }
        </mona-multi-select>
    `
})
class MultiSelectWrapperComponent implements ComponentInputsAsSignal<MultiSelectComponent> {
    readonly #formModel = signal<MultiSelectFormModel>({ value: [14] });
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
        if (!value) {
            return "";
        }
        return value.map(item => getFormValueText(item, textField)).join(", ");
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
    protected readonly multiSelectData = computed(() => {
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
                return { ...item, value: i, text: `${item.text} => ${i}` };
            })
            .toArray();
    });
    protected readonly tagConfig = computed(() => {
        const features = this.features();
        const subFeatures = features["summaryTag"]?.subFeatures || {};
        const active = features["summaryTag"].active;
        return {
            count: active ? (subFeatures["tagCount"].numericValue ?? 3) : -1,
            template: active ? subFeatures["tagTemplate"].active : false
        };
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

    public readonly autoClose = input<ReturnType<MultiSelectComponent["autoClose"]>>(false);
    public readonly checkboxes = input<ReturnType<MultiSelectComponent["checkboxes"]>>(false);
    public readonly data = input<ReturnType<MultiSelectComponent["data"]>>([]);
    public readonly disabled = model<ReturnType<MultiSelectComponent["disabled"]>>(false);
    public readonly itemDisabled = input<ReturnType<MultiSelectComponent["itemDisabled"]>>(() => false);
    public readonly loading = input<ReturnType<MultiSelectComponent["loading"]>>(false);
    public readonly popupClass = input<ReturnType<MultiSelectComponent["popupClass"]>>("");
    public readonly popupHeight = input<ReturnType<MultiSelectComponent["popupHeight"]>>(null);
    public readonly popupWidth = input<ReturnType<MultiSelectComponent["popupWidth"]>>(null);
    public readonly readonly = input<ReturnType<MultiSelectComponent["readonly"]>>(false);
    public readonly required = input<ReturnType<MultiSelectComponent["required"]>>(false);
    public readonly rounded = input<ReturnType<MultiSelectComponent["rounded"]>>("medium");
    public readonly showClearButton = input<ReturnType<MultiSelectComponent["showClearButton"]>>(true);
    public readonly size = input<ReturnType<MultiSelectComponent["size"]>>("medium");
    public readonly summaryTagTemplate = input<ReturnType<MultiSelectComponent["summaryTagTemplate"]>>(null);
    public readonly tagCount = input<ReturnType<MultiSelectComponent["tagCount"]>>(-1);
    public readonly textField = input<ReturnType<MultiSelectComponent["textField"]>>("text");
    public readonly valueField = input<ReturnType<MultiSelectComponent["valueField"]>>("value");

    protected onPopupClose(event: PreventableEvent) {
        const preventClose = this.features()["preventClose"].active;
        if (preventClose) {
            event.preventDefault();
            console.log("Multi select popup prevented from closing");
        }
    }

    protected onPopupClosed(): void {
        console.log("Multi select popup closed");
    }

    protected onPopupOpen(event: PreventableEvent) {
        const preventOpen = this.features()["preventOpen"].active;
        if (preventOpen) {
            event.preventDefault();
            console.log("Multi select popup prevented from opening");
        }
    }

    protected onPopupOpened(): void {
        console.log("Multi select popup opened");
    }
}

interface MultiSelectFormModel {
    value: unknown[];
}
