import { CurrencyPipe, NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, model, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { ImmutableSet, range } from "@mirei/ts-collections";
import { Box, LucideAngularModule, Search } from "lucide-angular";
import {
    ComboBoxComponent,
    DropDownFilterableDirective,
    DropDownFooterTemplateDirective,
    DropDownGroupableDirective,
    DropDownGroupHeaderTemplateDirective,
    DropDownHeaderTemplateDirective,
    DropDownItemTemplateDirective,
    DropDownNoDataTemplateDirective,
    DropdownPrefixTemplateDirective,
    DropDownVirtualScrollDirective,
    FilterableOptions,
    GroupableOptions,
    VirtualScrollOptions
} from "mona-ui";
import { map, Observable } from "rxjs";
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
    readonly #valueNormalizer = (text$: Observable<string>) =>
        text$.pipe(
            map(v => ({
                text: v,
                value: Math.random(),
                price: Math.random() * 10,
                category: "Custom",
                active: true
            }))
        );
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
            placeholder: {
                type: "string",
                value: ""
            },
            readonly: {
                type: "boolean",
                value: false
            },
            required: {
                type: "boolean",
                value: false
            },
            showClearButton: {
                type: "boolean",
                value: false
            },
            textField: {
                type: "string",
                value: "text"
            },
            valueField: {
                type: "string",
                value: "value"
            },
            valueNormalizer: {
                type: "dropdown",
                value: [this.#valueNormalizer],
                defaultValue: this.#valueNormalizer
            }
        },
        outputs: {},
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("ComboBoxComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
    protected readonly ComboBoxWrapperComponent = ComboBoxWrapperComponent;
}

@Component({
    imports: [
        ReactiveFormsModule,
        ComboBoxComponent,
        DropDownVirtualScrollDirective,
        DropDownNoDataTemplateDirective,
        DropdownPrefixTemplateDirective,
        LucideAngularModule,
        DropDownFooterTemplateDirective,
        DropDownHeaderTemplateDirective,
        DropDownGroupHeaderTemplateDirective,
        DropDownGroupableDirective,
        DropDownFilterableDirective,
        CurrencyPipe,
        DropDownItemTemplateDirective
    ],
    template: `
        @let featureData = features();
        @let groupingFeatures = featureData["grouping"]?.subFeatures || {};
        <span>Selected Value: {{ formValueText() }}</span>
        <form [formGroup]="formGroup">
            <mona-combo-box
                [allowCustomValue]="allowCustomValue()"
                [data]="comboBoxData()"
                [disabled]="disabled()"
                [itemDisabled]="itemDisabled()"
                [placeholder]="placeholder()"
                [readonly]="readonly()"
                [required]="required()"
                [showClearButton]="showClearButton()"
                [textField]="textField()"
                [valueField]="valueField()"
                [valueNormalizer]="valueNormalizer()"
                [monaDropDownGroupable]="grouping()"
                [monaDropDownFilterable]="filtering()"
                [monaDropDownVirtualScroll]="virtualization()"
                [formControl]="formGroup.controls.value"
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
            </mona-combo-box>
        </form>
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
    readonly #formGroup = new FormGroup({
        value: new FormControl<(typeof dropdownFoodData)[1] | null>(null, {
            nonNullable: false,
            validators: []
        })
    });
    readonly #formValue = toSignal(this.#formGroup.controls.value.valueChanges);
    protected readonly boxIcon = Box;
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
    protected readonly filtering = computed(() => {
        const features = this.features();
        const subFeatures = features["filtering"]?.subFeatures || {};
        const filteringOptions: FilterableOptions = {
            caseSensitive: subFeatures["caseSensitive"].active,
            debounce: subFeatures["debounce"].numericValue ?? 0,
            enabled: features["filtering"].active,
            operator: subFeatures["operator"].dropdownValue
        };
        return filteringOptions;
    });
    protected readonly formGroup = this.#formGroup;
    protected readonly formValueText = computed(() => {
        const value = this.#formValue();
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
    protected readonly searchIcon = Search;
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
    public readonly placeholder = input<ReturnType<ComboBoxComponent["placeholder"]>>("");
    public readonly readonly = model<ReturnType<ComboBoxComponent["readonly"]>>(false);
    public readonly required = model<ReturnType<ComboBoxComponent["required"]>>(false);
    public readonly showClearButton = input<ReturnType<ComboBoxComponent["showClearButton"]>>(false);
    public readonly textField = input<ReturnType<ComboBoxComponent["textField"]>>("text");
    public readonly valueField = input<ReturnType<ComboBoxComponent["valueField"]>>("value");
    public readonly valueNormalizer = input<ReturnType<ComboBoxComponent["valueNormalizer"]>>();

    public constructor() {
        effect(() => console.log("Selected item: ", this.#formValue()));
    }

    protected onValueAdd(value: string): void {
        console.log("Custom value added: ", value);
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
        this.#formGroup.controls.value.setValue(newItem);
    }
}
