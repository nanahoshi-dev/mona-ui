import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, input, model, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { range } from "@mirei/ts-collections";
import {
    AutoCompleteComponent,
    DropDownFilterableDirective,
    DropDownGroupableDirective,
    DropDownGroupHeaderTemplateDirective,
    DropDownVirtualScrollDirective,
    VirtualScrollOptions
} from "mona-ui";
import { GroupableOptions } from "mona-ui/src/lib/common/list/models/GroupableOptions";
import { FilterableOptions } from "mona-ui/src/lib/common/models/FilterableOptions";
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
    selector: "app-auto-complete-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./auto-complete-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AutoCompleteDemoComponent extends AbstractDemoComponent<AutoCompleteComponent<any>> {
    readonly #injector = createFeatureInjector({
        filtering: dropdownFilteringFeatureConfig("autocomplete"),
        grouping: dropdownGroupingFeatureConfig("autocomplete"),
        virtualization: dropdownVirtualizationFeatureConfig("dropdown")
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
            itemDisabled: {
                type: "function",
                value: (item: any) => false
            },
            placeholder: {
                type: "string",
                value: ""
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
        outputs: {},
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
        DropDownFilterableDirective
    ],
    template: `
        @let featureData = features();
        @let groupingFeatures = featureData["grouping"]?.subFeatures || {};
        <mona-auto-complete
            [data]="autoCompleteData()"
            [disabled]="disabled()"
            [itemDisabled]="itemDisabled()"
            [placeholder]="placeholder()"
            [rounded]="rounded()"
            [showClearButton]="showClearButton()"
            [size]="size()"
            [textField]="textField()"
            [valueField]="valueField()"
            [ngModel]="selectedItem()"
            (ngModelChange)="onItemSelect($event)"
            [monaDropDownGroupable]="grouping()"
            [monaDropDownFilterable]="filtering()"
            [monaDropDownVirtualScroll]="virtualization()"
            [groupBy]="groupBy()"
            class="w-50">
            @if (groupingFeatures["groupHeaderTemplate"]?.active) {
                <ng-template monaDropDownGroupHeaderTemplate let-group>
                    <span class="text-blue-600 font-semibold px-3 py-0.5 underline">Group: {{ group }}</span>
                </ng-template>
            }
        </mona-auto-complete>
    `,
    host: {
        class: "h-full"
    }
})
class AutoCompleteWrapperComponent implements ComponentInputsAsSignal<AutoCompleteComponent> {
    protected readonly autoCompleteData = computed(() => {
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
    protected readonly selectedItem = signal<unknown | null>(null);
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
    public readonly itemDisabled = input<ReturnType<AutoCompleteComponent["itemDisabled"]>>((item: any) => false);
    public readonly placeholder = input<ReturnType<AutoCompleteComponent["placeholder"]>>("");
    public readonly rounded = input<ReturnType<AutoCompleteComponent["rounded"]>>("medium");
    public readonly showClearButton = input<ReturnType<AutoCompleteComponent["showClearButton"]>>(false);
    public readonly size = input<ReturnType<AutoCompleteComponent["size"]>>("small");
    public readonly textField = input<ReturnType<AutoCompleteComponent["textField"]>>("text");
    public readonly valueField = input<ReturnType<AutoCompleteComponent["valueField"]>>("value");

    public onItemSelect(item: any) {
        this.selectedItem.set(item);
        console.log(item);
    }
}
