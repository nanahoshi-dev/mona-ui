import { DatePipe, JsonPipe, NgComponentOutlet } from "@angular/common";
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    input,
    linkedSignal,
    model,
    signal
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
    CellEditEvent,
    RowEditEvent,
    DataType,
    GridCellTemplateDirective,
    GridColumnComponent,
    GridComponent,
    GridDetailTemplateDirective,
    GridEditableDirective,
    GridGroupableDirective,
    GridSelectableDirective,
    GridSelectableOptions,
    GridVirtualScrollDirective,
    VirtualScrollOptions,
    GridEditTemplateDirective,
    SwitchComponent
} from "mona-ui";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

@Component({
    selector: "app-grid-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./grid-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GridDemoComponent extends AbstractDemoComponent<GridComponent<unknown>> {
    readonly #injector = createFeatureInjector({
        dataCount: {
            code: ``,
            name: "Data Count",
            description: "Change the number of generated data rows",
            type: "number",
            numericValue: 1000,
            numericNullable: false,
            numericMin: 0,
            numericMax: 1000000
        },
        cellTemplate: {
            code: ``,
            name: "Cell Template",
            description: "Customize the cell template for grid rows",
            active: false
        },
        selection: {
            code: ``,
            name: "Row Selection",
            description: "Enable row selection",
            active: false,
            subFeatures: {
                mode: {
                    code: ``,
                    active: false,
                    description: "Selection mode for row selection",
                    name: "Mode",
                    type: "dropdown",
                    dropdownDataSource: ["single", "multiple"] as const,
                    dropdownValue: "single"
                }
            }
        },
        virtualization: {
            code: ``,
            active: false,
            description: `Enable virtualization for the grid to improve performance with large datasets.`,
            name: "Virtualization",
            subFeatures: {
                rowHeight: {
                    code: ``,
                    active: false,
                    description: `Height of each row in pixels.`,
                    name: "Row Height",
                    type: "number",
                    numericValue: 32
                },
                infiniteScroll: {
                    code: ``,
                    active: false,
                    description: `Enable infinite scroll for the grid to load more data as the user scrolls.`,
                    name: "Infinite Scroll",
                    type: "boolean",
                    subFeatures: {
                        scrollEndThreshold: {
                            code: ``,
                            active: false,
                            description: `The threshold in pixels from the end of the grid at which the infinite scroll will trigger.`,
                            name: "Scroll End Threshold",
                            type: "number",
                            numericValue: 100
                        }
                    }
                }
            }
        }
    });
    protected readonly config = signal<ComponentConfig<GridComponent<unknown>>>({
        code: ``,
        inputs: {
            data: {
                type: "iterable",
                value: []
            },
            filter: {
                type: "iterable",
                value: []
            },
            filterable: {
                type: "boolean",
                value: false
            },
            pageSize: {
                type: "number",
                value: 10
            },
            pageSizeValues: {
                type: "iterable",
                value: [10, 20, 30, 40, 50]
            },
            reorderable: {
                type: "boolean",
                value: false
            },
            resizable: {
                type: "boolean",
                value: false
            },
            resizeMethod: {
                type: "dropdown",
                value: ["auto", "fitView"],
                defaultValue: "fitView"
            },
            responsivePager: {
                type: "boolean",
                value: false
            },
            rounded: {
                type: "dropdown",
                value: ["small", "medium", "large", "none"],
                defaultValue: "medium"
            },
            sort: {
                type: "iterable",
                value: []
            },
            sortable: {
                type: "boolean",
                value: false
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("GridComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
    protected readonly GridWrapperComponent = GridWrapperComponent;
}

@Component({
    imports: [
        GridComponent,
        GridColumnComponent,
        GridSelectableDirective,
        GridGroupableDirective,
        GridVirtualScrollDirective,
        GridDetailTemplateDirective,
        JsonPipe,
        GridEditableDirective,
        GridCellTemplateDirective,
        DatePipe,
        GridEditTemplateDirective,
        SwitchComponent,
        FormsModule
    ],
    template: `
        @let effectiveGridData = virtualization().enabled ? virtualGridData() : gridData();
        @let featureData = this.features();
        <mona-grid
            [data]="effectiveGridData"
            [filter]="filter()"
            [filterable]="filterable()"
            [pageSize]="pageSize()"
            [pageSizeValues]="pageSizeValues()"
            [reorderable]="reorderable()"
            [resizable]="resizable()"
            [resizeMethod]="resizeMethod()"
            [responsivePager]="responsivePager()"
            [rounded]="rounded()"
            [sort]="sort()"
            [sortable]="sortable()"
            (cellEdit)="onCellEdit($event)"
            (rowEdit)="onRowEdit($event)"
            [monaGridEditable]="{ enabled: true, mode: 'cell' }"
            [monaGridVirtualScroll]="virtualization()"
            [scrollEndThreshold]="infiniteScroll()?.scrollEndThreshold || 5"
            (scrollEnd)="onScrollEnd()"
            [monaGridGroupable]="{ enabled: true }"
            [monaGridSelectable]="selection()"
            class="w-full h-96">
            <!--            <ng-container monaGridContextMenu>-->
            <!--                <mona-contextmenu-item [label]="'Menu Item 1'">-->
            <!--                    <mona-contextmenu-item [label]="'Submenu Item 1'"></mona-contextmenu-item>-->
            <!--                    <mona-contextmenu-item [label]="'Submenu Item 2'"></mona-contextmenu-item>-->
            <!--                </mona-contextmenu-item>-->
            <!--                <mona-contextmenu-item [label]="'Menu Item 2'"></mona-contextmenu-item>-->
            <!--            </ng-container>-->
            @for (column of columns; track column.field) {
                @let width = null;
                <mona-grid-column
                    [field]="column.field"
                    [title]="column.title"
                    [type]="column.filterType"
                    [width]="width">
                    @if (featureData["cellTemplate"].active) {
                        <ng-template monaGridCellTemplate let-dataItem>
                            <span class="truncate" #cellElement>
                                @if (column.filterType === "date") {
                                    {{ dataItem[column.field] | date }}
                                } @else {
                                    {{ dataItem[column.field] }}
                                }
                            </span>
                        </ng-template>
                    }
                </mona-grid-column>
            }
            <ng-template monaGridDetailTemplate let-dataItem>
                <pre class="h-full w-full p-2">{{ dataItem | json }}</pre>
            </ng-template>
        </mona-grid>
    `
})
class GridWrapperComponent implements ComponentInputsAsSignal<GridComponent<unknown>> {
    protected readonly columns: Array<{ field: string; title: string; filterType: DataType }> = [
        { field: "OrderID", title: "Order ID", filterType: "number" },
        { field: "ShipName", title: "Ship Name", filterType: "string" },
        { field: "Freight", title: "Freight", filterType: "number" },
        { field: "ShipCity", title: "Ship City", filterType: "string" },
        { field: "ShipCountry", title: "Ship Country", filterType: "string" },
        { field: "Delivered", title: "Delivered", filterType: "boolean" },
        { field: "OrderDate", title: "Order Date", filterType: "date" },
        { field: "ShippedDate", title: "Shipped Date", filterType: "date" }
    ];
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly gridData = signal(generateRandomGridData(1000));
    protected readonly infiniteScroll = computed(() => {
        const features = this.features();
        const virtualizationFeature = features["virtualization"];
        if (!virtualizationFeature.active) {
            return null;
        }

        const virtualizationSubFeatures = virtualizationFeature.subFeatures || {};
        const infiniteScrollOptions = virtualizationSubFeatures["infiniteScroll"];
        if (!infiniteScrollOptions.active) {
            return null;
        }
        const infiniteScrollSubFeatures = infiniteScrollOptions.subFeatures || {};
        const scrollEndThreshold = infiniteScrollSubFeatures["scrollEndThreshold"]?.numericValue ?? 5;
        return { scrollEndThreshold };
    });
    protected readonly selection = computed(() => {
        const features = this.features();
        const subFeatures = features["selection"].subFeatures || {};
        const selectableOptions: GridSelectableOptions = {
            enabled: features["selection"].active ?? false,
            mode: subFeatures["mode"].dropdownValue ?? "single"
        };
        return selectableOptions;
    });
    protected readonly virtualGridData = linkedSignal<
        { scrollEndThreshold: number } | null,
        Record<PropertyKey, unknown>[]
    >({
        source: () => this.infiniteScroll(),
        computation: (params, previous) => {
            if (!params) {
                return generateRandomGridData(100000);
            }
            return generateRandomGridData(100);
        }
    });
    protected readonly virtualization = computed(() => {
        const features = this.features();
        const subFeatures = features["virtualization"].subFeatures || {};
        const height = subFeatures["rowHeight"].numericValue ?? 31;
        const enabled = features["virtualization"].active ?? false;
        const virtualization: VirtualScrollOptions = { enabled, height };
        return virtualization;
    });
    public readonly data = input<ReturnType<GridComponent<unknown>["data"]>>([]);
    public readonly filter = model<ReturnType<GridComponent<unknown>["filter"]>>([]);
    public readonly filterable = input<ReturnType<GridComponent<unknown>["filterable"]>>(false);
    public readonly pageSize = input<ReturnType<GridComponent<unknown>["pageSize"]>>(10);
    public readonly pageSizeValues = input<ReturnType<GridComponent<unknown>["pageSizeValues"]>>([10, 20, 30, 40, 50]);
    public readonly reorderable = input<ReturnType<GridComponent<unknown>["reorderable"]>>(false);
    public readonly resizable = input<ReturnType<GridComponent<unknown>["resizable"]>>(false);
    public readonly resizeMethod = input<ReturnType<GridComponent<unknown>["resizeMethod"]>>("fitView");
    public readonly rounded = input<ReturnType<GridComponent<unknown>["rounded"]>>("medium");
    public readonly responsivePager = input<ReturnType<GridComponent<unknown>["responsivePager"]>>(false);
    public readonly sort = model<ReturnType<GridComponent<unknown>["sort"]>>([]);
    public readonly sortable = input<ReturnType<GridComponent<unknown>["sortable"]>>(false);

    protected onScrollEnd(): void {
        if (this.infiniteScroll()) {
            this.virtualGridData.update(data => [
                ...data,
                ...generateRandomGridData(10, this.virtualGridData().length)
            ]);
        }
    }
}

function generateRandomGridData(count: number, startFrom = 0): Record<PropertyKey, unknown>[] {
    const generatedData = [];
    const cities = [
        "Paris",
        "Berlin",
        "London",
        "Madrid",
        "Munich",
        "Rome",
        "Prague",
        "Vienna",
        "Amsterdam",
        "Barcelona",
        "Brussels",
        "Athens",
        "Copenhagen",
        "Dublin",
        "Helsinki",
        "Lisbon",
        "Oslo",
        "Warsaw",
        "Stockholm",
        "Budapest"
    ];
    const countries = [
        "France",
        "Germany",
        "UK",
        "Spain",
        "Italy",
        "Austria",
        "Netherlands",
        "Belgium",
        "Greece",
        "Denmark",
        "Ireland",
        "Finland",
        "Portugal",
        "Norway",
        "Poland",
        "Sweden",
        "Hungary",
        "Czech Republic",
        "Switzerland",
        "Slovakia"
    ];
    const shipNames = [
        "Sea Explorer",
        "Ocean Vision",
        "Wave Jumper",
        "Marine Dream",
        "Nautical Disrupter",
        "Water Bookmark",
        "Aquatic Friend",
        "Windy Ship",
        "Breezy Transport",
        "Salty Companion",
        "Maritime Galore",
        "Sunny Voyage",
        "Ripple Marvel",
        "Watery Trail",
        "Jolly Sailor",
        "Brave Navigator",
        "Vibrant Lifeline",
        "Seafarer's Delight",
        "Uncharted Journey",
        "Thunderous Whirlpool"
    ];
    let orderNumber = 1 + startFrom;

    for (let i = 0; i < count; i++) {
        const now = new Date();
        const randomCityIndex = Math.floor(Math.random() * cities.length);
        const randomCountryIndex = Math.floor(Math.random() * countries.length);
        const randomShipNameIndex = Math.floor(Math.random() * shipNames.length);

        generatedData.push({
            OrderID: orderNumber++,
            ShipName: shipNames[randomShipNameIndex],
            Freight: Math.floor(Math.random() * 100),
            ShipCity: cities[randomCityIndex],
            ShipCountry: countries[randomCountryIndex],
            Delivered: Math.random() > 0.5, //Math.floor(Math.random() * 4),
            OrderDate: new Date(),
            ShippedDate: new Date(now.setDate(now.getDate() + Math.random() * 30))
        });
    }

    return generatedData;
}
