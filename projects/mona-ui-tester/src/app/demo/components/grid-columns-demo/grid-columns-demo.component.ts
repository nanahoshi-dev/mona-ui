import { Component, computed, inject, Injector, linkedSignal, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import {
    GridColumnComponent,
    GridComponent,
    GridReorderableDirective,
    GridResizableDirective,
    GridToolbarTemplateDirective
} from "@nanahoshi/mona-ui/grid";
import type {
    ColumnReorderEvent,
    ColumnResizeEvent,
    ReorderableOptions,
    ResizableOptions,
    ResizeMethod
} from "@nanahoshi/mona-ui/grid";
import { SegmentedComponent } from "@nanahoshi/mona-ui/segmented";
import type { SegmentedOption } from "@nanahoshi/mona-ui/segmented";
import { filter, map } from "rxjs";
import { ComponentMetadata } from "../../models/ComponentMetadata";
import { DemoService } from "../../services/demo.service";
import { ComponentConfigFeatureItem, ComponentConfigInputType } from "../../utils/componentConfig";
import { DemoEventLog, DemoPart, DemoPartValues, readPartValues, reconcilePartValues } from "../../utils/demoParts";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { PartsDemoContainerComponent } from "../parts-demo-container/parts-demo-container.component";
import { type ColumnsDataSet, columnsOrders } from "./grid-columns-demo.data";

type ColumnId = "customer" | "freight" | "orderDate" | "orderId" | "shipCity" | "shipCountry";

interface ColumnSpec {
    readonly code: readonly string[];
    readonly id: ColumnId;
    readonly locked: boolean;
    readonly lockedPosition: "left" | "right";
    readonly title: string;
    readonly width: number | null;
}

/** Wide enough together to scroll sideways, with Order ID locked on the left and Freight on the right. */
const COLUMNS: readonly ColumnSpec[] = [
    {
        id: "orderId",
        title: "Order ID column",
        code: ['field="orderId"', 'type="number"'],
        locked: true,
        lockedPosition: "left",
        width: 110
    },
    {
        id: "customer",
        title: "Customer column",
        code: ['field="customer"'],
        locked: false,
        lockedPosition: "left",
        width: 220
    },
    {
        id: "shipCity",
        title: "Ship city column",
        code: ['field="shipCity"'],
        locked: false,
        lockedPosition: "left",
        width: 160
    },
    {
        id: "shipCountry",
        title: "Ship country column",
        code: ['field="shipCountry"'],
        locked: false,
        lockedPosition: "left",
        width: 160
    },
    {
        id: "orderDate",
        title: "Order date column",
        code: ['field="orderDate"', 'type="date"'],
        locked: false,
        lockedPosition: "left",
        width: 150
    },
    {
        id: "freight",
        title: "Freight column",
        code: ['field="freight"', 'type="number"'],
        locked: true,
        lockedPosition: "right",
        width: 120
    }
];

const COLUMN_TITLES: Readonly<Record<ColumnId, string>> = {
    customer: "Customer",
    freight: "Freight",
    orderDate: "Ordered",
    orderId: "Order ID",
    shipCity: "Ship city",
    shipCountry: "Ship country"
};

const RESIZE_METHODS: readonly { readonly text: string; readonly value: ResizeMethod }[] = [
    { text: "fitView", value: "fitView" },
    { text: "auto", value: "auto" },
    { text: "120 (pixels)", value: 120 },
    { text: "200 (pixels)", value: 200 }
];

/**
 * The playground of the Grid Columns page. It covers resizing and reordering columns, locking them to either side,
 * hiding them, the Columns button of the toolbar, and how the grid sizes columns without a width. It shares nothing
 * with the other grid playgrounds.
 */
@Component({
    selector: "app-grid-columns-demo",
    imports: [
        GridColumnComponent,
        GridComponent,
        GridReorderableDirective,
        GridResizableDirective,
        GridToolbarTemplateDirective,
        PartsDemoContainerComponent,
        SegmentedComponent
    ],
    templateUrl: "./grid-columns-demo.component.html"
})
export class GridColumnsDemoComponent {
    readonly #gridFeatures = this.#features({
        toolbarTemplate: {
            name: "Toolbar (shows the Columns button)",
            description:
                "Adds a toolbar above the headers. The toolbar also shows the built-in Columns button, which hides " +
                "and shows columns. Without a toolbar template there is no Columns button.",
            active: true,
            code: `
                <ng-template monaGridToolbarTemplate>
                    <span class="text-sm font-medium">Orders</span>
                </ng-template>`
        }
    });
    readonly #metadata = toSignal(
        inject(DemoService).metadata$.pipe(
            filter(metadata => !!metadata),
            map(metadata => metadata ?? {})
        ),
        { initialValue: {} as Record<string, ComponentMetadata> }
    );
    readonly #reorderableFeatures = this.#features({
        reorderableOptions: {
            name: "Options object",
            description:
                "Binds a ReorderableOptions object instead of the bare attribute. Off here means the bare " +
                "monaGridReorderable, which turns reordering on.",
            active: true,
            directiveBinding: {
                hostAttribute: "monaGridReorderable",
                buildValue: features => readReorderable(features)
            },
            subFeatures: {
                enabled: {
                    name: "Enabled",
                    description: "Drag a header, or press Ctrl+Shift+Arrow keys on it, to move a column.",
                    active: true
                }
            }
        },
        keepOrderIdFirst: {
            name: "Keep Order ID first",
            description:
                "Calls preventDefault() on the columnReorder event when the Order ID column is moved, so it stays " +
                "where it is. This lives in your event handler, so it adds no attribute.",
            active: false
        }
    });
    readonly #resizableFeatures = this.#features({
        resizableOptions: {
            name: "Options object",
            description:
                "Binds a ResizableOptions object instead of the bare attribute. Off here means the bare " +
                "monaGridResizable, which turns resizing on.",
            active: true,
            directiveBinding: { hostAttribute: "monaGridResizable", buildValue: features => readResizable(features) },
            subFeatures: {
                enabled: {
                    name: "Enabled",
                    description:
                        "Drag the edge of a header to resize its column, between its minimum and maximum width.",
                    active: true
                }
            }
        }
    });
    protected readonly columns = computed(() => {
        const values = this.values();
        const read = (id: ColumnId) => readPartValues<GridColumnComponent>(this.#part(id), values);
        return {
            customer: read("customer"),
            freight: read("freight"),
            orderDate: read("orderDate"),
            orderId: read("orderId"),
            shipCity: read("shipCity"),
            shipCountry: read("shipCountry")
        };
    });
    protected readonly data = computed(() => columnsOrders(this.dataSet()));
    protected readonly dataSet = signal<ColumnsDataSet>("orders");
    protected readonly dataSetOptions: readonly SegmentedOption<ColumnsDataSet>[] = [
        { label: "120 orders", value: "orders" },
        { label: "3 orders", value: "few" }
    ];
    protected readonly eventLog = new DemoEventLog();
    protected readonly grid = computed(() => readPartValues<GridComponent<unknown>>(this.#part("grid"), this.values()));
    protected readonly gridFeatures = this.#gridFeatures.data;
    protected readonly parts = computed<readonly DemoPart[]>(() => {
        const metadata = this.#metadata();
        const gridMetadata = metadata["GridComponent"] ?? emptyMetadata();
        const columnMetadata = metadata["GridColumnComponent"] ?? emptyMetadata();
        const resizableMetadata = metadata["GridResizableDirective"] ?? emptyMetadata();
        const reorderableMetadata = metadata["GridReorderableDirective"] ?? emptyMetadata();
        return [
            {
                id: "grid",
                title: "Grid",
                metadata: gridMetadata,
                codeAttributes: ['[data]="orders"', 'class="h-112"'],
                config: {
                    inputs: deriveInputConfig<GridComponent<unknown>>(gridMetadata, gridOverrides(), {
                        resolveAliases: true
                    }),
                    featureHandler: this.#gridFeatures
                }
            },
            {
                id: "resizable",
                title: "Resizing",
                metadata: resizableMetadata,
                placement: "host",
                codeAttributes: ['(columnResize)="onColumnResize($event)"'],
                config: {
                    inputs: deriveInputConfig<GridResizableDirective>(resizableMetadata, { options: undefined }),
                    featureHandler: this.#resizableFeatures
                }
            },
            {
                id: "reorderable",
                title: "Reordering",
                metadata: reorderableMetadata,
                placement: "host",
                codeAttributes: ['(columnReorder)="onColumnReorder($event)"'],
                config: {
                    inputs: deriveInputConfig<GridReorderableDirective>(reorderableMetadata, { options: undefined }),
                    featureHandler: this.#reorderableFeatures
                }
            },
            ...COLUMNS.map((column): DemoPart => ({
                id: column.id,
                title: column.title,
                metadata: columnMetadata,
                codeAttributes: column.code,
                config: {
                    inputs: deriveInputConfig<GridColumnComponent>(columnMetadata, columnOverrides(column), {
                        resolveAliases: true
                    })
                }
            }))
        ];
    });
    /** The panels come from metadata that loads after the page; until then the grid would get no settings. */
    protected readonly ready = computed(() => this.parts().every(part => (part.metadata.inputs ?? []).length > 0));
    protected readonly reorderable = computed(() => readReorderable(this.#reorderableFeatures.data()));
    protected readonly resizable = computed(() => readResizable(this.#resizableFeatures.data()));
    protected readonly values = linkedSignal<readonly DemoPart[], DemoPartValues>({
        source: this.parts,
        computation: (parts, previous) => reconcilePartValues(parts, previous?.value)
    });

    protected onColumnReorder(event: ColumnReorderEvent): void {
        if (this.#reorderableFeatures.data()["keepOrderIdFirst"]?.active && event.column.field === "orderId") {
            event.preventDefault();
        }
        this.eventLog.record("columnReorder", {
            field: event.column.field,
            newIndex: event.newIndex,
            oldIndex: event.oldIndex,
            prevented: event.isDefaultPrevented()
        });
    }

    protected onColumnResize(event: ColumnResizeEvent): void {
        this.eventLog.record("columnResize", {
            field: event.column.field,
            newWidth: event.newWidth,
            oldWidth: event.oldWidth
        });
    }

    protected onDataSetChange(set: ColumnsDataSet | null): void {
        if (set) {
            this.dataSet.set(set);
        }
    }

    protected onPageSizeChange(pageSize: number | undefined): void {
        this.values.update(values => ({ ...values, grid: { ...values["grid"], pageSize } }));
        this.eventLog.record("pageSizeChange", pageSize);
    }

    #features(data: ComponentConfigFeatureItem): FeatureConfigHandler {
        return createFeatureInjector(data, inject(Injector)).get(FeatureConfigHandler);
    }

    #part(id: string): DemoPart | undefined {
        return this.parts().find(part => part.id === id);
    }
}

function emptyMetadata(): ComponentMetadata {
    return { inputs: [], name: "", selector: "" };
}

/** The options object, or `""` for the bare attribute when the options feature is off. */
function readReorderable(features: ComponentConfigFeatureItem): ReorderableOptions | "" {
    const options = features["reorderableOptions"];
    return options?.active ? { enabled: options.subFeatures?.["enabled"]?.active ?? true } : "";
}

/** The options object, or `""` for the bare attribute when the options feature is off. */
function readResizable(features: ComponentConfigFeatureItem): ResizableOptions | "" {
    const options = features["resizableOptions"];
    return options?.active ? { enabled: options.subFeatures?.["enabled"]?.active ?? true } : "";
}

/** The label, the page size and how columns without a width get theirs. The rest has its own page. */
function gridOverrides(): Partial<ComponentConfigInputType<GridComponent<unknown>>> {
    return {
        ariaLabel: { alias: "aria-label", type: "string", value: "Orders" },
        ariaLabelledBy: undefined,
        data: undefined,
        expandedKeys: undefined,
        pageSize: { type: "number", value: 10, min: 1, nullable: false },
        pageSizeValues: undefined,
        resizeMethod: {
            type: "customDropdown",
            value: RESIZE_METHODS,
            textField: "text",
            valueField: "value",
            defaultValue: "fitView",
            note: "How columns without a width get theirs. A number gives each of them that many pixels."
        },
        responsivePager: undefined,
        rounded: undefined,
        rowClass: undefined,
        rowKey: undefined,
        skip: undefined,
        userClass: undefined
    };
}

/** The layout inputs: locking, width limits, visibility and the title. Sorting, filtering and editing have pages of their own. */
function columnOverrides(column: ColumnSpec): Partial<ComponentConfigInputType<GridColumnComponent>> {
    return {
        aggregate: undefined,
        editable: undefined,
        field: undefined,
        filterable: undefined,
        format: undefined,
        hidden: { type: "boolean", value: false, note: "Where the column starts. The Columns button changes it." },
        locked: { type: "boolean", value: column.locked, note: "Keeps the column in place while the grid scrolls." },
        lockedPosition: {
            type: "dropdown",
            value: ["left", "right"],
            defaultValue: column.lockedPosition,
            note: "The side a locked column sticks to."
        },
        maxWidth: { type: "number", nullable: true, value: null, min: 40 },
        minWidth: { type: "number", nullable: false, value: 40, min: 0 },
        sortComparator: undefined,
        sortable: undefined,
        stateKey: undefined,
        title: { type: "string", value: COLUMN_TITLES[column.id] },
        type: undefined,
        width: { type: "number", nullable: true, value: column.width, min: 40 }
    };
}
