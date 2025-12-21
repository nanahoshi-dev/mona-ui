import { CurrencyPipe, JsonPipe, NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, input, model, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { range } from "@mirei/ts-collections";
import {
    DropDownFilterableDirective,
    DropDownFooterTemplateDirective,
    DropDownGroupableDirective,
    DropDownGroupHeaderTemplateDirective,
    DropDownHeaderTemplateDirective,
    DropDownItemTemplateDirective,
    DropdownListComponent,
    DropDownListValueTemplateDirective,
    DropDownVirtualScrollDirective
} from "../../../../../../mona-ui/src/lib";
import { GroupableOptions } from "../../../../../../mona-ui/src/lib/common/list/models/GroupableOptions";
import { FilterableOptions } from "../../../../../../mona-ui/src/lib/common/models/FilterableOptions";
import { VirtualScrollOptions } from "../../../../../../mona-ui/src/lib/common/models/VirtualScrollOptions";
import { dropdownFoodData } from "../../../../assets/dropdown.data";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import {
    dropdownFilteringFeatureConfig,
    dropdownGroupingFeatureConfig,
    dropdownVirtualizationFeatureConfig
} from "../../utils/dropdownFeatureConfigs";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-dropdown-list-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./dropdown-list-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DropdownListDemoComponent extends AbstractDemoComponent<DropdownListComponent> {
    readonly #injector = createFeatureInjector({
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
            placeholder: {
                type: "string",
                value: "Select an option"
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
        outputs: {},
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("DropdownListComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([
        "DropDownFilterableDirective",
        "DropDownGroupableDirective"
    ]);
    protected readonly DropdownListWrapperComponent = DropdownListWrapperComponent;
}

@Component({
    imports: [
        DropdownListComponent,
        DropDownFilterableDirective,
        DropDownGroupableDirective,
        DropDownHeaderTemplateDirective,
        DropDownFooterTemplateDirective,
        DropDownListValueTemplateDirective,
        DropDownItemTemplateDirective,
        DropDownGroupHeaderTemplateDirective,
        DropDownVirtualScrollDirective,
        CurrencyPipe,
        FormsModule
    ],
    host: {
        class: "flex flex-col items-center justify-center w-full"
    },
    template: `
        @let featureData = features();
        @let groupingFeatures = featureData["grouping"]?.subFeatures || {};
        <mona-drop-down-list
            [data]="dropdownData()"
            [disabled]="disabled()"
            [itemDisabled]="itemDisabled()"
            [placeholder]="placeholder()"
            [rounded]="rounded()"
            [showClearButton]="showClearButton()"
            [size]="size()"
            [textField]="textField()"
            [valueField]="valueField()"
            [ngModel]="selectedItem()"
            (ngModelChange)="onValueChange($event)"
            [monaDropDownGroupable]="grouping()"
            [monaDropDownFilterable]="filtering()"
            [monaDropDownVirtualScroll]="virtualization()"
            [groupBy]="groupBy()"
            class="w-44">
            @if (featureData["footerTemplate"].active) {
                <ng-template monaDropDownFooterTemplate>
                    <div class="p-2 bg-accent text-foreground border-t border-t-border font-semibold">
                        Total items: {{ dropdownData().length }}
                    </div>
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
            @if (featureData["valueTemplate"].active) {
                <ng-template monaDropDownListValueTemplate let-item>
                    <span class="text-pink-600 font-bold">{{ item?.text }}</span>
                </ng-template>
            }
            @if (groupingFeatures["groupHeaderTemplate"]?.active) {
                <ng-template monaDropDownGroupHeaderTemplate let-group>
                    <span class="text-blue-600 font-semibold px-3 py-0.5 underline">Group: {{ group }}</span>
                </ng-template>
            }
        </mona-drop-down-list>
        <!--        <app-code-viewer [code]="selectedItem() | json" language="json"></app-code-viewer>-->
    `
})
export class DropdownListWrapperComponent implements ComponentInputsAsSignal<DropdownListComponent> {
    protected readonly dropdownData = computed(() => {
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
    protected readonly groupBy = computed(() => {
        const features = this.features();
        const subFeatures = features["grouping"]?.subFeatures || {};
        return subFeatures["groupBy"].dropdownValue;
    });
    protected readonly grouping = computed(() => {
        const features = this.features();
        const subFeatures = features["grouping"]?.subFeatures || {};
        const groupingOptions: GroupableOptions<unknown, unknown> = {
            enabled: features["grouping"].active,
            headerOrder: subFeatures["headerOrder"].dropdownValue,
            orderBy: subFeatures["orderBy"].dropdownValue,
            orderByDirection: subFeatures["orderByDirection"].dropdownValue
        };
        return groupingOptions;
    });
    protected readonly selectedItem = signal<any>(null);
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
    public readonly placeholder = input<ReturnType<DropdownListComponent["placeholder"]>>("Select an option");
    public readonly rounded = input<ReturnType<DropdownListComponent["rounded"]>>("medium");
    public readonly showClearButton = input<ReturnType<DropdownListComponent["showClearButton"]>>(false);
    public readonly size = input<ReturnType<DropdownListComponent["size"]>>("medium");
    public readonly textField = input<ReturnType<DropdownListComponent["textField"]>>("text");
    public readonly valueField = input<ReturnType<DropdownListComponent["valueField"]>>("value");

    protected onValueChange(value: any): void {
        this.selectedItem.set(value);
        console.log("Selected value:", value);
    }
}
