import { CurrencyPipe, NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, model, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { range } from "@mirei/ts-collections";
import { Box, Check, LucideAngularModule, Search, TriangleAlert } from "lucide-angular";
import {
    AutoCompleteComponent,
    DropDownFilterableDirective,
    DropDownFooterTemplateDirective,
    DropDownGroupableDirective,
    DropDownGroupHeaderTemplateDirective,
    DropDownHeaderTemplateDirective,
    DropDownItemTemplateDirective,
    DropDownNoDataTemplateDirective,
    DropdownPrefixTemplateDirective,
    DropdownSuffixTemplateDirective,
    DropDownVirtualScrollDirective,
    FilterableOptions,
    GroupableOptions,
    PreventableEvent,
    VirtualScrollOptions
} from "mona-ui";
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
    dropdownSuffixTemplateFeatureConfig,
    dropdownVirtualizationFeatureConfig
} from "../../utils/dropdownFeatureConfigs";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-auto-complete-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./auto-complete-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AutoCompleteDemoComponent extends AbstractDemoComponent<AutoCompleteComponent<any>> {
    readonly #injector = createFeatureInjector({
        dataSet: dropdownDataSetFeatureConfig("autocomplete"),
        filtering: dropdownFilteringFeatureConfig("autocomplete"),
        footerTemplate: dropdownFooterTemplateFeatureConfig("autocomplete"),
        grouping: dropdownGroupingFeatureConfig("autocomplete"),
        headerTemplate: dropdownHeaderTemplateFeatureConfig("autocomplete"),
        itemTemplate: dropdownItemTemplateFeatureConfig("autocomplete"),
        noDataTemplate: dropdownNoDataTemplateFeatureConfig("autocomplete"),
        prefixTemplate: dropdownPrefixTemplateFeatureConfig("autocomplete"),
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
        suffixTemplate: dropdownSuffixTemplateFeatureConfig("autocomplete"),
        virtualization: dropdownVirtualizationFeatureConfig("autocomplete")
    });
    protected readonly config = signal<ComponentConfig<AutoCompleteComponent<any>>>({
        code: ``,
        inputs: {
            data: {
                type: "iterable",
                value: []
            },
            disabled: {
                type: "boolean",
                value: false
            },
            highlightFirst: {
                type: "boolean",
                value: true
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
            readonly: {
                type: "boolean",
                value: false
            },
            required: {
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
                value: ["small", "medium", "large"],
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
    protected readonly metadata = this.getMetadata("AutoCompleteComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
    protected readonly AutoCompleteWrapperComponent = AutoCompleteWrapperComponent;
}

@Component({
    imports: [
        AutoCompleteComponent,
        FormsModule,
        DropDownGroupableDirective,
        DropDownGroupHeaderTemplateDirective,
        DropDownVirtualScrollDirective,
        DropDownFilterableDirective,
        DropdownPrefixTemplateDirective,
        LucideAngularModule,
        DropdownSuffixTemplateDirective,
        DropDownFooterTemplateDirective,
        DropDownItemTemplateDirective,
        DropDownNoDataTemplateDirective,
        DropDownHeaderTemplateDirective,
        CurrencyPipe,
        ReactiveFormsModule
    ],
    template: `
        @let featureData = features();
        @let groupingFeatures = featureData["grouping"]?.subFeatures || {};
        <span>Selected Value: {{ formValue() }}</span>
        <form [formGroup]="formGroup">
            <mona-auto-complete
                [data]="autoCompleteData()"
                [disabled]="disabled()"
                [highlightFirst]="highlightFirst()"
                [itemDisabled]="itemDisabled()"
                [loading]="loading()"
                [placeholder]="placeholder()"
                [popupClass]="popupClass()"
                [popupHeight]="popupHeight()"
                [popupWidth]="popupWidth()"
                [readonly]="readonly()"
                [required]="required()"
                [rounded]="rounded()"
                [showClearButton]="showClearButton()"
                [size]="size()"
                [textField]="textField()"
                [valueField]="valueField()"
                [monaDropDownGroupable]="grouping()"
                [monaDropDownFilterable]="filtering()"
                [monaDropDownVirtualScroll]="virtualization()"
                [groupBy]="groupBy()"
                [formControlName]="'value'"
                (close)="onPopupClose($event)"
                (open)="onPopupOpen($event)"
                class="w-50">
                @if (featureData["footerTemplate"].active) {
                    <ng-template monaDropDownFooterTemplate>
                        <div class="p-2 bg-accent text-foreground border-t border-t-border font-semibold">
                            Total items: {{ autoCompleteData().length }}
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
                        <div
                            class="flex flex-col items-center select-none justify-center w-full h-full gap-2 opacity-30">
                            <lucide-angular [name]="boxIcon"></lucide-angular>
                            <span>No items found</span>
                        </div>
                    </ng-template>
                }
                @if (featureData["prefixTemplate"].active) {
                    <ng-template monaDropdownPrefixTemplate>
                        <lucide-angular [name]="searchIcon" [size]="16" class="h-full ml-1"></lucide-angular>
                    </ng-template>
                }
                @if (featureData["suffixTemplate"].active) {
                    <ng-template monaDropdownSuffixTemplate>
                        @if (selectedItem()) {
                            <lucide-angular
                                [name]="checkIcon"
                                [size]="16"
                                class="h-full mx-1"
                                [style.color]="'var(--color-success)'"></lucide-angular>
                        } @else {
                            <lucide-angular
                                [name]="alertIcon"
                                [size]="16"
                                class="h-full mx-1"
                                [style.color]="'var(--color-warning)'"></lucide-angular>
                        }
                    </ng-template>
                }
            </mona-auto-complete>
        </form>
    `
})
class AutoCompleteWrapperComponent implements ComponentInputsAsSignal<AutoCompleteComponent> {
    readonly #formGroup = new FormGroup({
        value: new FormControl<string | null>(null, { nonNullable: false, validators: [] })
    });

    protected readonly alertIcon = TriangleAlert;
    protected readonly autoCompleteData = computed(() => {
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
                return { ...item, value: i, text: `${i} - ${item.text}` };
            })
            .toArray();
    });
    protected readonly boxIcon = Box;
    protected readonly checkIcon = Check;
    protected readonly features = inject(FeatureConfigHandler).data;
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
    protected readonly formGroup = this.#formGroup;
    protected readonly formValue = toSignal(this.#formGroup.controls.value.valueChanges);
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
    protected readonly searchIcon = Search;
    protected readonly selectedItem = signal<unknown>(null);
    protected readonly virtualization = computed(() => {
        const features = this.features();
        const subFeatures = features["virtualization"]?.subFeatures || {};
        const options: Partial<VirtualScrollOptions> = {
            enabled: features["virtualization"].active,
            height: subFeatures["itemHeight"].numericValue
        };
        return options;
    });
    public readonly data = input<ReturnType<AutoCompleteComponent["data"]>>([]);
    public readonly disabled = model<ReturnType<AutoCompleteComponent["disabled"]>>(false);
    public readonly highlightFirst = input<ReturnType<AutoCompleteComponent["highlightFirst"]>>(true);
    public readonly itemDisabled = input<ReturnType<AutoCompleteComponent["itemDisabled"]>>(null);
    public readonly loading = input<ReturnType<AutoCompleteComponent["loading"]>>(false);
    public readonly placeholder = input<ReturnType<AutoCompleteComponent["placeholder"]>>("");
    public readonly popupClass = input<ReturnType<AutoCompleteComponent["popupClass"]>>("");
    public readonly popupHeight = input<ReturnType<AutoCompleteComponent["popupHeight"]>>(null);
    public readonly popupWidth = input<ReturnType<AutoCompleteComponent["popupWidth"]>>(null);
    public readonly readonly = input<ReturnType<AutoCompleteComponent["readonly"]>>(false);
    public readonly required = input<ReturnType<AutoCompleteComponent["required"]>>(false);
    public readonly rounded = input<ReturnType<AutoCompleteComponent["rounded"]>>("medium");
    public readonly showClearButton = input<ReturnType<AutoCompleteComponent["showClearButton"]>>(false);
    public readonly size = input<ReturnType<AutoCompleteComponent["size"]>>("small");
    public readonly textField = input<ReturnType<AutoCompleteComponent["textField"]>>("text");
    public readonly valueField = input<ReturnType<AutoCompleteComponent["valueField"]>>("value");

    public constructor() {
        effect(() => console.log("Selected item: ", this.formValue()));
    }

    protected onPopupClose(event: PreventableEvent) {
        const preventClose = this.features()["preventClose"].active;
        if (preventClose) {
            event.preventDefault();
            console.log("Popup prevented from closing");
        }
    }
    protected onPopupOpen(event: PreventableEvent) {
        const preventOpen = this.features()["preventOpen"].active;
        if (preventOpen) {
            event.preventDefault();
            console.log("Popup prevented from opening");
        }
    }
}
