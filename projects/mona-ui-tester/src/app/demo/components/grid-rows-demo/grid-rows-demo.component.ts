import { Component, computed, inject, Injector, linkedSignal, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { AvatarComponent } from "@nanahoshi/mona-ui/avatar";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    GridCellTemplateDirective,
    GridColumnComponent,
    GridComponent,
    GridDetailTemplateDirective,
    GridRowReorderableDirective
} from "@nanahoshi/mona-ui/grid";
import type { GridRowClass, RowReorderableOptions, RowReorderEvent } from "@nanahoshi/mona-ui/grid";
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
import { type RowsDataSet, type RowsOrder, rowsOrders } from "./grid-rows-demo.data";

type ColumnId = "customer" | "freight" | "orderId" | "shipped";

interface ColumnSpec {
    readonly code: readonly string[];
    readonly id: ColumnId;
    readonly title: string;
}

const COLUMNS: readonly ColumnSpec[] = [
    { id: "orderId", title: "Order ID column", code: ['field="orderId"', 'type="number"'] },
    { id: "customer", title: "Customer column", code: ['field="customer"'] },
    { id: "freight", title: "Freight column", code: ['field="freight"', 'type="number"'] },
    { id: "shipped", title: "Shipped column", code: ['field="shipped"', 'type="boolean"'] }
];

const COLUMN_TITLES: Readonly<Record<ColumnId, string>> = {
    customer: "Customer",
    freight: "Freight",
    orderId: "Order ID",
    shipped: "Shipped"
};

const ROW_CLASSES: readonly { readonly text: string; readonly value: GridRowClass<RowsOrder> | null }[] = [
    { text: "None", value: null },
    { text: "Dim shipped orders", value: order => (order.shipped ? "opacity-60" : null) },
    { text: "Bold heavy freight", value: order => (order.freight > 100 ? "font-semibold" : null) }
];

/**
 * The playground of the Grid Rows page. It covers detail rows and the keys of the open ones, moving rows by their
 * handle, classes for each row, and rows that grow to fit a taller cell template. It shares nothing with the other
 * grid playgrounds.
 */
@Component({
    selector: "app-grid-rows-demo",
    imports: [
        AvatarComponent,
        ButtonDirective,
        GridCellTemplateDirective,
        GridColumnComponent,
        GridComponent,
        GridDetailTemplateDirective,
        GridRowReorderableDirective,
        PartsDemoContainerComponent,
        SegmentedComponent
    ],
    templateUrl: "./grid-rows-demo.component.html"
})
export class GridRowsDemoComponent {
    readonly #customerFeatures = this.#features({
        tallCells: {
            name: "Tall cells",
            description:
                "A cell template with an avatar over two lines. Rows grow to fit it, without a row height to set.",
            active: false,
            code: `
                <ng-template monaGridCellTemplate let-order>
                    <div class="flex items-center gap-3">
                        <mona-avatar
                            labelColor="white"
                            backgroundColor="#44607e"
                            borderRadius="50%"
                            [label]="order.initials"
                            [width]="40"
                            [height]="40" />
                        <div>
                            <div>{{ order.customer }}</div>
                            <div class="text-xs">{{ order.contact }}</div>
                        </div>
                    </div>
                </ng-template>`
        }
    });
    readonly #gridFeatures = this.#features({
        detailTemplate: {
            name: "Detail template",
            description:
                "Adds a toggle to each row that opens a detail row beneath it. The keys of the open rows are the " +
                "two-way expandedKeys, by rowKey, so code can open and close them too.",
            active: true,
            code: `
                <ng-template monaGridDetailTemplate let-order>
                    <ul class="list-disc ps-5 text-sm">
                        @for (line of order.lines; track $index) {
                            <li>{{ line.quantity }} × {{ line.product }}</li>
                        }
                    </ul>
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
    readonly #rowReorderFeatures = this.#features({
        rowReorderableOptions: {
            name: "Options object",
            description:
                "Binds a RowReorderableOptions object instead of the bare attribute. Off here means the bare " +
                "monaGridRowReorderable, which turns row reordering on.",
            active: true,
            directiveBinding: {
                hostAttribute: "monaGridRowReorderable",
                buildValue: features => rowReorderableSample(features)
            },
            subFeatures: {
                enabled: {
                    name: "Enabled",
                    description: "Drag a row by its handle, or press Alt+ArrowUp or Alt+ArrowDown on the handle.",
                    active: true
                },
                canReorder: {
                    name: "Only unshipped rows move",
                    description:
                        "A canReorder function that disables the handle of shipped orders. A function, so the code " +
                        "sample leaves it out.",
                    active: false
                },
                rowAriaLabel: {
                    name: "Name handles after the order",
                    description:
                        "A rowAriaLabel function that names each handle after its order instead of its position. A " +
                        "function, so the code sample leaves it out.",
                    active: false
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
            orderId: read("orderId"),
            shipped: read("shipped")
        };
    });
    protected readonly customerFeatures = this.#customerFeatures.data;
    protected readonly dataSet = signal<RowsDataSet>("orders");
    protected readonly dataSetOptions: readonly SegmentedOption<RowsDataSet>[] = [
        { label: "40 orders", value: "orders" },
        { label: "5 orders", value: "few" }
    ];
    protected readonly eventLog = new DemoEventLog();
    protected readonly expandedKeys = signal<unknown[]>([]);
    protected readonly grid = computed(() => readPartValues<GridComponent<unknown>>(this.#part("grid"), this.values()));
    protected readonly gridFeatures = this.#gridFeatures.data;
    /** The consumer owns the row order: a reorder replaces it, and a new data set starts over. */
    protected readonly orders = linkedSignal<RowsOrder[]>(() => rowsOrders(this.dataSet()));
    protected readonly parts = computed<readonly DemoPart[]>(() => {
        const metadata = this.#metadata();
        const gridMetadata = metadata["GridComponent"] ?? emptyMetadata();
        const columnMetadata = metadata["GridColumnComponent"] ?? emptyMetadata();
        const rowReorderMetadata = metadata["GridRowReorderableDirective"] ?? emptyMetadata();
        return [
            {
                id: "grid",
                title: "Grid",
                metadata: gridMetadata,
                codeAttributes: [
                    '[data]="orders()"',
                    'rowKey="orderId"',
                    '[(expandedKeys)]="expandedKeys"',
                    'class="h-112"'
                ],
                config: {
                    inputs: deriveInputConfig<GridComponent<unknown>>(gridMetadata, gridOverrides(), {
                        resolveAliases: true
                    }),
                    featureHandler: this.#gridFeatures
                }
            },
            {
                id: "rowReorderable",
                title: "Row reordering",
                metadata: rowReorderMetadata,
                placement: "host",
                codeAttributes: ['(rowReorder)="onRowReorder($event)"'],
                config: {
                    inputs: deriveInputConfig<GridRowReorderableDirective>(rowReorderMetadata, { options: undefined }),
                    featureHandler: this.#rowReorderFeatures
                }
            },
            ...COLUMNS.map((column): DemoPart => ({
                id: column.id,
                title: column.title,
                metadata: columnMetadata,
                codeAttributes: column.code,
                config: {
                    inputs: deriveInputConfig<GridColumnComponent>(columnMetadata, columnOverrides(column.id), {
                        resolveAliases: true
                    }),
                    featureHandler: column.id === "customer" ? this.#customerFeatures : undefined
                }
            }))
        ];
    });
    /** The panels come from metadata that loads after the page; until then the grid would get no settings. */
    protected readonly ready = computed(() => this.parts().every(part => (part.metadata.inputs ?? []).length > 0));
    protected readonly rowReorderable = computed(() => readRowReorderable(this.#rowReorderFeatures.data()));
    protected readonly skip = signal(0);
    protected readonly values = linkedSignal<readonly DemoPart[], DemoPartValues>({
        source: this.parts,
        computation: (parts, previous) => reconcilePartValues(parts, previous?.value)
    });

    protected onCollapseAll(): void {
        this.expandedKeys.set([]);
    }

    protected onDataSetChange(set: RowsDataSet | null): void {
        if (set) {
            this.dataSet.set(set);
            this.skip.set(0);
        }
    }

    protected onExpandAllOnPage(): void {
        const pageSize = this.grid().pageSize ?? 10;
        const skip = this.skip();
        this.expandedKeys.set(
            this.orders()
                .slice(skip, skip + pageSize)
                .map(order => order.orderId)
        );
    }

    protected onExpandedKeysChange(keys: unknown[]): void {
        this.expandedKeys.set(keys);
        this.eventLog.record("expandedKeysChange", keys);
    }

    protected onPageSizeChange(pageSize: number | undefined): void {
        this.values.update(values => ({ ...values, grid: { ...values["grid"], pageSize } }));
        this.eventLog.record("pageSizeChange", pageSize);
    }

    protected onRowReorder(event: RowReorderEvent): void {
        this.orders.set([...event.reorderedData] as unknown as RowsOrder[]);
        this.eventLog.record("rowReorder", {
            currentIndex: event.currentIndex,
            orderId: event.rowData["orderId"],
            previousIndex: event.previousIndex
        });
    }

    protected onSkipChange(skip: number): void {
        this.skip.set(skip);
        this.eventLog.record("skipChange", skip);
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

/** The options the grid gets, or `""` for the bare attribute when the options feature is off. */
function readRowReorderable(features: ComponentConfigFeatureItem): RowReorderableOptions | "" {
    const options = features["rowReorderableOptions"];
    if (!options?.active) {
        return "";
    }
    const sub = options.subFeatures ?? {};
    return {
        enabled: sub["enabled"]?.active ?? true,
        ...(sub["canReorder"]?.active ? { canReorder: (row: Record<PropertyKey, unknown>) => !row["shipped"] } : {}),
        ...(sub["rowAriaLabel"]?.active
            ? { rowAriaLabel: (row: Record<PropertyKey, unknown>) => `Order ${String(row["orderId"])}` }
            : {})
    };
}

/** The options as the code sample writes them. Functions can't be written as a value, so it leaves them out. */
function rowReorderableSample(features: ComponentConfigFeatureItem): RowReorderableOptions | "" {
    const options = readRowReorderable(features);
    return options === "" ? options : { enabled: options.enabled };
}

/** The label, the page size and the row classes. The rest has its own page. */
function gridOverrides(): Partial<ComponentConfigInputType<GridComponent<unknown>>> {
    return {
        ariaLabel: { alias: "aria-label", type: "string", value: "Orders" },
        ariaLabelledBy: undefined,
        data: undefined,
        expandedKeys: undefined,
        pageSize: { type: "number", value: 10, min: 1, nullable: false },
        pageSizeValues: undefined,
        resizeMethod: undefined,
        responsivePager: undefined,
        rounded: undefined,
        rowClass: {
            type: "customDropdown",
            value: ROW_CLASSES,
            textField: "text",
            valueField: "value",
            defaultValue: null,
            note: "A function that returns classes for each data row."
        },
        rowKey: undefined,
        skip: undefined,
        userClass: undefined
    };
}

/** Only the title: the columns have a page of their own. */
function columnOverrides(id: ColumnId): Partial<ComponentConfigInputType<GridColumnComponent>> {
    return {
        aggregate: undefined,
        editable: undefined,
        field: undefined,
        filterable: undefined,
        format: undefined,
        hidden: undefined,
        locked: undefined,
        lockedPosition: undefined,
        maxWidth: undefined,
        minWidth: undefined,
        sortComparator: undefined,
        sortable: undefined,
        stateKey: undefined,
        title: { type: "string", value: COLUMN_TITLES[id] },
        type: undefined,
        width: undefined
    };
}
