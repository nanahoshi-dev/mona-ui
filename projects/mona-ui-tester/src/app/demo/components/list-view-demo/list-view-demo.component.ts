import { NgComponentOutlet } from "@angular/common";
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    inject,
    input,
    linkedSignal,
    signal
} from "@angular/core";
import { range } from "@mirei/ts-collections";
import {
    type GroupableOptions,
    ListViewComponent,
    ListViewFooterTemplateDirective,
    ListViewGroupableDirective,
    ListViewGroupHeaderTemplateDirective,
    ListViewHeaderTemplateDirective,
    ListViewItemTemplateDirective,
    ListViewNavigableDirective,
    ListViewNoDataTemplateDirective,
    ListViewPageableDirective,
    ListViewSelectableDirective,
    ListViewVirtualScrollDirective,
    NavigableOptions,
    type PagerSettings,
    type SelectableOptions,
    SlicePipe,
    VirtualScrollOptions
} from "mona-ui";
import { dropdownFoodData } from "../../../../assets/dropdown.data";
import type { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";
import { twMerge } from "tailwind-merge";

@Component({
    selector: "app-list-view-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./list-view-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListViewDemoComponent extends AbstractDemoComponent<ListViewComponent> {
    readonly #injector = createFeatureInjector({
        dataSet: {
            code: ``,
            hasCode: false,
            active: false,
            description: "Sets a predefined data set for the list view",
            name: "Data Set",
            type: "dropdown",
            dropdownDataSource: ["foods", "empty"],
            dropdownValue: "foods"
        },
        footerTemplate: {
            code: ``,
            active: false,
            description: "Enables custom footer template for the list view",
            name: "Footer Template"
        },
        grouping: {
            code: ``,
            active: false,
            description: "Enables grouping for the list view",
            name: "Grouping",
            subFeatures: {
                groupBy: {
                    code: ``,
                    hasCode: false,
                    active: false,
                    description: "Sets the field to group items by",
                    name: "Group By",
                    type: "dropdown",
                    dropdownDataSource: ["category", "origin", (item: any) => item.text.charAt(0)],
                    dropdownValue: "category"
                },
                groupHeaderTemplate: {
                    code: ``,
                    active: false,
                    description: "Enables custom header template for group headers",
                    name: "Group Header Template",
                    type: "boolean"
                },
                headerOrder: {
                    code: ``,
                    hasCode: false,
                    active: false,
                    description: "Sets the order of group headers",
                    name: "Header Order",
                    type: "dropdown",
                    dropdownDataSource: ["asc", "desc", null],
                    dropdownValue: null
                },
                orderBy: {
                    code: ``,
                    hasCode: false,
                    active: false,
                    description: "Sets the field to order groups by",
                    name: "Order By",
                    type: "dropdown",
                    dropdownDataSource: ["text", "price"],
                    dropdownValue: "text"
                },
                orderByDirection: {
                    code: ``,
                    hasCode: false,
                    active: false,
                    description: "Sets the order direction for groups",
                    name: "Order By Direction",
                    type: "dropdown",
                    dropdownDataSource: ["asc", "desc"],
                    dropdownValue: "asc"
                }
            }
        },
        headerTemplate: {
            code: ``,
            active: false,
            description: "Enables custom header template for the list view",
            name: "Header Template"
        },
        infiniteScroll: {
            code: ``,
            active: false,
            hasCode: false,
            description: "Enables infinite scroll mode for the list view by utilizing the scrollBottom event.",
            name: "Infinite Scroll",
            type: "boolean"
        },
        itemTemplate: {
            code: ``,
            active: false,
            description: "Enables custom item template for the list view",
            name: "Item Template"
        },
        layout: {
            code: ``,
            active: false,
            hasCode: false,
            description: "",
            name: "Layout",
            type: "dropdown",
            dropdownDataSource: ["Default", "Gallery"],
            dropdownValue: "Default"
        },
        navigation: {
            code: ``,
            active: false,
            description: "Enables keyboard navigation for the list view",
            name: "Navigation",
            subFeatures: {
                mode: {
                    code: ``,
                    hasCode: false,
                    active: false,
                    description: `
                        Sets the navigation mode. Select mode only works when selection is enabled.
                        If selection is disabled, navigation mode will default to highlight.
                    `,
                    name: "Navigation Mode",
                    type: "dropdown",
                    dropdownDataSource: ["highlight", "select"],
                    dropdownValue: "highlight"
                },
                wrap: {
                    code: ``,
                    hasCode: false,
                    active: false,
                    description: "Enables wrapping of navigation",
                    name: "Wrap Navigation",
                    type: "boolean"
                }
            }
        },
        noDataTemplate: {
            code: ``,
            active: false,
            description: "Enables custom no data template for the list view",
            name: "No Data Template"
        },
        pagination: {
            code: ``,
            active: false,
            description: "Enables pagination for the list view. Does not work with virtualization.",
            name: "Pagination",
            subFeatures: {
                firstLast: {
                    code: ``,
                    hasCode: false,
                    active: false,
                    description: "Shows first and last buttons",
                    name: "Show First/Last",
                    type: "boolean"
                },
                type: {
                    code: ``,
                    hasCode: false,
                    active: false,
                    description: "Sets the pagination type",
                    name: "Pagination Type",
                    type: "dropdown",
                    dropdownDataSource: ["numeric", "input"],
                    dropdownValue: "numeric"
                },
                previousNext: {
                    code: ``,
                    hasCode: false,
                    active: false,
                    description: "Shows previous and next buttons",
                    name: "Show Previous/Next",
                    type: "boolean"
                },
                pageSizeValues: {
                    code: ``,
                    hasCode: false,
                    active: false,
                    description: "Sets the page size options",
                    name: "Page Size Options",
                    type: "dropdown",
                    dropdownDataSource: [
                        [5, 10, 20, 25, 50, 100],
                        [10, 25, 50],
                        [20, 50, 100]
                    ],
                    dropdownValue: [5, 10, 20, 25, 50, 100]
                },
                showInfo: {
                    code: ``,
                    hasCode: false,
                    active: false,
                    description: "Shows pagination info",
                    name: "Show Info",
                    type: "boolean"
                },
                visiblePages: {
                    code: ``,
                    hasCode: false,
                    active: false,
                    description: "Sets the number of visible pages",
                    name: "Visible Pages",
                    type: "number",
                    numericValue: 5
                }
            }
        },
        selection: {
            code: ``,
            active: false,
            description: "Enables selection for the list view",
            name: "Selection",
            subFeatures: {
                mode: {
                    code: ``,
                    hasCode: false,
                    active: false,
                    description: "Sets the selection mode",
                    name: "Selection Mode",
                    type: "dropdown",
                    dropdownDataSource: ["single", "multiple"],
                    dropdownValue: "single"
                },
                selectBy: {
                    code: ``,
                    hasCode: false,
                    active: false,
                    description: "Sets the selectBy field",
                    name: "Select By",
                    type: "dropdown",
                    dropdownDataSource: ["text", "value"],
                    dropdownValue: "value"
                },
                toggleable: {
                    code: ``,
                    hasCode: false,
                    active: false,
                    description: "Enables toggleable selection. Only applicable in single selection mode.",
                    name: "Toggleable Selection",
                    type: "boolean"
                }
            }
        },
        virtualization: {
            code: ``,
            active: false,
            description: "Enables virtualization for the list view",
            name: "Virtualization",
            subFeatures: {
                itemHeight: {
                    code: ``,
                    hasCode: false,
                    active: false,
                    description: "Sets the height of each item in pixels",
                    name: "Item Height",
                    type: "number",
                    numericValue: 28
                }
            }
        }
    });
    protected readonly config = signal<ComponentConfig<ListViewComponent>>({
        code: ``,
        inputs: {
            height: {
                type: "string",
                value: "300px"
            },
            items: {
                type: "object"
            },
            listClass: {
                type: "string",
                value: ""
            },
            listItemClass: {
                type: "string",
                value: ""
            },
            listItemStyle: {
                type: "dropdown",
                value: [{}, { color: "red" }],
                defaultValue: {}
            },
            listStyle: {
                type: "dropdown",
                value: [{}, { backgroundColor: "aliceblue" }],
                defaultValue: {}
            },
            rounded: {
                type: "dropdown",
                value: ["none", "small", "medium", "large"],
                defaultValue: "medium"
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
            width: {
                type: "string",
                value: "200px"
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("ListViewComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
    protected readonly ListViewWrapperComponent = ListViewWrapperComponent;
}

@Component({
    imports: [
        ListViewComponent,
        ListViewNavigableDirective,
        ListViewSelectableDirective,
        ListViewGroupableDirective,
        ListViewGroupHeaderTemplateDirective,
        ListViewVirtualScrollDirective,
        ListViewItemTemplateDirective,
        ListViewHeaderTemplateDirective,
        ListViewFooterTemplateDirective,
        ListViewNoDataTemplateDirective,
        ListViewPageableDirective,
        SlicePipe
    ],
    template: `
        @let featureData = features();
        @let groupingFeatures = featureData["grouping"]?.subFeatures || {};
        <mona-list-view
            [height]="height()"
            [items]="listViewItems() | monaSlice: 0 : scrollBottomItemCount()"
            [listClass]="listClassInput()"
            [listItemClass]="listItemClass()"
            [listItemStyle]="listItemStyle()"
            [listStyle]="listStyle()"
            [rounded]="rounded()"
            [size]="size()"
            [textField]="textField()"
            [width]="listWidth()"
            [monaListViewGroupable]="grouping()"
            [groupBy]="groupBy()"
            [monaListViewNavigable]="navigation()"
            [monaListViewPageable]="pagination()"
            [monaListViewSelectable]="selection()"
            [selectedKeys]="selectedKeys()"
            (selectedKeysChange)="onSelectedKeysChange($event)"
            [selectBy]="selectBy()"
            [monaListViewVirtualScroll]="virtualization()"
            (scrollBottom)="onScrollBottom()">
            @if (featureData["footerTemplate"].active) {
                <ng-template monaListViewFooterTemplate>
                    <div class="px-3 py-1 bg-secondary border-0 border-t border-solid border-border font-bold">
                        {{ listViewItems().length }} items
                    </div>
                </ng-template>
            }
            @if (featureData["itemTemplate"].active) {
                @if (featureData["layout"].dropdownValue === "Default") {
                    <ng-template monaListViewItemTemplate let-item>
                        <div class="flex items-center gap-2 w-full">
                            <span class="flex-1">{{ item.text }}</span>
                            <span class="text-green-600">\${{ item.price }}</span>
                        </div>
                    </ng-template>
                } @else if (featureData["layout"].dropdownValue === "Gallery") {
                    <ng-template monaListViewItemTemplate let-item>
                        <div class="flex flex-col gap-2 w-full">
                            @if (item.image) {
                                <img
                                    [src]="item.image"
                                    [style.width.px]="100"
                                    [style.height.px]="100"
                                    [alt]="item.text" />
                            } @else {
                                <div class="flex items-center justify center">No image.</div>
                            }
                            <span class="inline-flex justify-center">{{ item.text }}</span>
                        </div>
                    </ng-template>
                }
            }
            @if (groupingFeatures["groupHeaderTemplate"].active) {
                <ng-template monaListViewGroupHeaderTemplate let-group>
                    <div class="font-semibold w-full h-full px-3 py-1 underline bg-secondary text-blue-600">
                        {{ group }}
                    </div>
                </ng-template>
            }
            @if (featureData["headerTemplate"].active) {
                <ng-template monaListViewHeaderTemplate>
                    <div class="px-3 py-1 bg-secondary border-0 border-b border-solid border-border font-bold">
                        Food List
                    </div>
                </ng-template>
            }
            @if (featureData["noDataTemplate"].active) {
                <ng-template monaListViewNoDataTemplate>
                    <div class="w-full h-full flex items-center justify-center text-muted-foreground">
                        No items available.
                    </div>
                </ng-template>
            }
        </mona-list-view>
    `
})
class ListViewWrapperComponent implements ComponentInputsAsSignal<ListViewComponent> {
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly groupBy = computed(() => {
        const features = this.features();
        const subFeatures = features["grouping"]?.subFeatures || {};
        return subFeatures["groupBy"]?.dropdownValue;
    });
    protected readonly grouping = computed(() => {
        const features = this.features();
        const subFeatures = features["grouping"]?.subFeatures || {};
        return {
            enabled: features["grouping"].active,
            headerOrder: subFeatures["headerOrder"].dropdownValue,
            orderBy: subFeatures["orderBy"].dropdownValue,
            orderByDirection: subFeatures["orderByDirection"].dropdownValue
        } as GroupableOptions;
    });
    protected readonly listClassInput = computed(() => {
        const features = this.features();
        const layout = features["layout"].dropdownValue;
        if (layout === "Default") {
            return this.listClass();
        }
        return twMerge(
            `flex flex-wrap p-4 [&_li]:w-40 [&_li]:h-40 [&_li]:items-center [&_li]:justify-center`,
            this.listClass()
        );
    });
    protected readonly listViewItems = computed(() => {
        const dataSet = this.features()["dataSet"]?.dropdownValue;
        if (dataSet === "empty") {
            return [];
        }
        const virtualization = this.virtualization();
        if (virtualization.enabled) {
            return range(1, 50000)
                .select(i => {
                    const item = dropdownFoodData[i % dropdownFoodData.length];
                    return { ...item, value: i, text: `${item.text} ${i}` };
                })
                .toArray();
        }
        const infiniteScroll = this.features()["infiniteScroll"]?.active;
        if (infiniteScroll) {
            return range(1, 200)
                .select(i => {
                    const item = dropdownFoodData[i % dropdownFoodData.length];
                    return { ...item, value: i, text: `${item.text} ${i}` };
                })
                .toArray();
        }
        return dropdownFoodData;
    });
    protected readonly listWidth = linkedSignal({
        source: () => this.width(),
        computation: width => {
            const features = this.features();
            const layout = features["layout"];
            const pagination = features["pagination"];
            const virtualization = features["virtualization"];
            const items = this.listViewItems();
            if (layout.dropdownValue === "Gallery") {
                return `550px`;
            }
            if (virtualization.active) {
                return width;
            }
            if (pagination.active && items.length > 0) {
                return ``;
            }
            return width;
        }
    });
    protected readonly navigation = computed(() => {
        const features = this.features();
        const subFeatures = features["navigation"]?.subFeatures || {};
        const options: Partial<NavigableOptions> = {
            enabled: features["navigation"].active,
            mode: subFeatures["mode"].dropdownValue,
            wrap: subFeatures["wrap"].active
        };
        return options;
    });
    protected readonly pagination = computed(() => {
        const features = this.features();
        const subFeatures = features["pagination"]?.subFeatures || {};
        const options: Partial<PagerSettings> = {
            enabled: features["pagination"].active,
            showInfo: subFeatures["showInfo"].active,
            firstLast: subFeatures["firstLast"].active,
            type: subFeatures["type"].dropdownValue,
            previousNext: subFeatures["previousNext"].active,
            pageSizeValues: subFeatures["pageSizeValues"].dropdownValue,
            visiblePages: subFeatures["visiblePages"].numericValue
        };
        return options;
    });
    protected readonly scrollBottomItemCount = signal(20);
    protected readonly selectedKeys = signal<number[]>([]);
    protected readonly selection = computed<Partial<SelectableOptions>>(() => {
        const features = this.features();
        const subFeatures = features["selection"]?.subFeatures || {};
        const mode = subFeatures["mode"].dropdownValue;
        if (mode === "single") {
            return {
                enabled: features["selection"].active,
                mode: "single",
                toggleable: subFeatures["toggleable"].active
            };
        }
        return {
            enabled: features["selection"].active,
            mode: "multiple"
        };
    });
    protected readonly selectBy = computed(() => {
        const features = this.features();
        const subFeatures = features["selection"].subFeatures || {};
        return subFeatures["selectBy"].dropdownValue;
    });
    protected readonly virtualization = computed(() => {
        const features = this.features();
        const subFeatures = features["virtualization"]?.subFeatures || {};
        const options: VirtualScrollOptions = {
            enabled: features["virtualization"].active,
            height: subFeatures["itemHeight"].numericValue as number
        };
        return options;
    });
    public readonly height = input<ReturnType<ListViewComponent["height"]>>("100%");
    public readonly listClass = input<ReturnType<ListViewComponent["listClass"]>>("");
    public readonly listItemClass = input<ReturnType<ListViewComponent["listItemClass"]>>("");
    public readonly listItemStyle = input<ReturnType<ListViewComponent["listItemStyle"]>>({});
    public readonly listStyle = input<ReturnType<ListViewComponent["listStyle"]>>({});
    public readonly items = input<ReturnType<ListViewComponent["items"]>>([]);
    public readonly rounded = input<ReturnType<ListViewComponent["rounded"]>>("medium");
    public readonly size = input<ReturnType<ListViewComponent["size"]>>("medium");
    public readonly textField = input<ReturnType<ListViewComponent["textField"]>>("");
    public readonly width = input<ReturnType<ListViewComponent["width"]>>("100%");

    public constructor() {
        effect(() => {
            const infiniteScroll = this.features()["infiniteScroll"].active;
            if (!infiniteScroll) {
                this.scrollBottomItemCount.set(this.listViewItems().length);
            } else {
                this.scrollBottomItemCount.set(20);
            }
        });
    }

    protected onScrollBottom(): void {
        const infiniteScroll = this.features()["infiniteScroll"].active;
        if (!infiniteScroll) {
            return;
        }
        this.scrollBottomItemCount.update(i => i + 10);
    }

    protected onSelectedKeysChange(keys: number[]): void {
        this.selectedKeys.set(keys);
        console.log(keys);
    }
}
