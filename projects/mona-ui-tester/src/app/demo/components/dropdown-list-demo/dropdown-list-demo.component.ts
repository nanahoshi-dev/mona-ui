import { CurrencyPipe, NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, input, model, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
    DropDownFilterableDirective,
    DropDownGroupableDirective,
    DropDownGroupHeaderTemplateDirective,
    DropDownItemTemplateDirective,
    DropdownListComponent,
    DropDownListValueTemplateDirective
} from "../../../../../../mona-ui/src/lib";
import { GroupableOptions } from "../../../../../../mona-ui/src/lib/common/list/models/GroupableOptions";
import { FilterableOptions } from "../../../../../../mona-ui/src/lib/common/models/FilterableOptions";
import { dropdownFoodData } from "../../../../assets/dropdown.data";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
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
        filtering: {
            code: ``,
            active: false,
            description: `Enable filtering of items in the dropdown list.`,
            name: "Filtering",
            subFeatures: {
                caseSensitive: {
                    code: ``,
                    active: false,
                    description: `Enable case sensitive filtering.`,
                    name: "Case Sensitive",
                    type: "boolean"
                },
                debounce: {
                    code: ``,
                    active: false,
                    description: `Debounce time in milliseconds for filtering.`,
                    name: "Debounce",
                    type: "number"
                },
                operator: {
                    code: ``,
                    active: false,
                    description: `Filtering operator to use.`,
                    name: "Operator",
                    type: "dropdown",
                    dropdownDataSource: ["contains", "startsWith", "endsWith"],
                    dropdownValue: "contains"
                }
            }
        },
        grouping: {
            code: ``,
            active: false,
            description: `Enable grouping of items in the dropdown list.`,
            name: "Grouping",
            subFeatures: {
                groupBy: {
                    code: ``,
                    active: false,
                    description: `Field to group the items by.`,
                    name: "Group By",
                    type: "dropdown",
                    dropdownDataSource: ["category", "origin"],
                    dropdownValue: "category"
                },
                headerOrder: {
                    code: ``,
                    active: false,
                    description: `Order of the group headers.`,
                    name: "Header Order",
                    type: "dropdown",
                    dropdownDataSource: ["asc", "desc", undefined],
                    dropdownValue: "asc"
                },
                orderBy: {
                    code: ``,
                    active: false,
                    description: `Field to order the items by within each group.`,
                    name: "Order By",
                    type: "dropdown",
                    dropdownDataSource: ["text", "value", "price"],
                    dropdownValue: "text"
                },
                orderByDirection: {
                    code: ``,
                    active: false,
                    description: `Direction to order the items by within each group.`,
                    name: "Order By Direction",
                    type: "dropdown",
                    dropdownDataSource: ["asc", "desc"],
                    dropdownValue: "asc"
                },
                groupHeaderTemplate: {
                    code: ``,
                    active: false,
                    description: `This template is used to customize the group header template of the dropdown list.`,
                    name: "Group Header Template"
                }
            }
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
        }
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
        DropDownListValueTemplateDirective,
        DropDownItemTemplateDirective,
        DropDownGroupHeaderTemplateDirective,
        CurrencyPipe,
        FormsModule
    ],
    template: `
        @let featureData = features();
        @let groupingFeatures = featureData["grouping"]?.subFeatures || {};
        <mona-drop-down-list
            [data]="dropdownData"
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
            [groupBy]="groupBy()"
            class="w-40">
            @if (featureData["itemTemplate"].active) {
                <ng-template monaDropDownItemTemplate let-item>
                    <div class="flex flex-row w-full">
                        <span class="flex-1">{{ item.text }}</span>
                        <span class="inline-flex items-center justify-center invert text-xs text-gray-500">{{
                            item.price | currency
                        }}</span>
                    </div>
                </ng-template>
            }
            @if (featureData["valueTemplate"].active) {
                <ng-template monaDropDownListValueTemplate let-item>
                    <span class="text-violet-600 font-bold">{{ item?.text }}</span>
                </ng-template>
            }
            @if (groupingFeatures["groupHeaderTemplate"]?.active) {
                <ng-template monaDropDownGroupHeaderTemplate let-group>
                    <span class="text-blue-600 font-semibold">Group: {{ group }}</span>
                </ng-template>
            }
        </mona-drop-down-list>
    `
})
export class DropdownListWrapperComponent implements ComponentInputsAsSignal<DropdownListComponent> {
    protected readonly dropdownData = dropdownFoodData;
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
    public readonly data = input<ReturnType<DropdownListComponent["data"]>>([]);
    public readonly disabled = model<ReturnType<DropdownListComponent["disabled"]>>(false);
    public readonly itemDisabled = input<ReturnType<DropdownListComponent["itemDisabled"]>>(item => false);
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
