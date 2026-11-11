import { Component, computed, inject, Injector, linkedSignal, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ChipComponent } from "@nanahoshi/mona-ui/chip";
import {
    GridCellTemplateDirective,
    GridColumnComponent,
    GridColumnTitleTemplateDirective,
    GridComponent,
    GridHeaderTemplateDirective,
    GridNoDataTemplateDirective,
    GridToolbarTemplateDirective
} from "@nanahoshi/mona-ui/grid";
import type { ColumnFormat, GridRowClass, ResizeMethod } from "@nanahoshi/mona-ui/grid";
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
import { type OverviewDataSet, type OverviewOrder, overviewOrders } from "./grid-overview-demo.data";

type ColumnId = "customer" | "freight" | "orderDate" | "orderId" | "shipped";

interface ColumnSpec {
    readonly code: readonly string[];
    readonly id: ColumnId;
    readonly title: string;
}

const COLUMNS: readonly ColumnSpec[] = [
    { id: "orderId", title: "Order ID column", code: ['field="orderId"', 'type="number"'] },
    { id: "customer", title: "Customer column", code: ['field="customer"'] },
    { id: "freight", title: "Freight column", code: ['field="freight"', 'type="number"'] },
    { id: "orderDate", title: "Order date column", code: ['field="orderDate"', 'type="date"'] },
    { id: "shipped", title: "Shipped column", code: ['field="shipped"', 'type="boolean"'] }
];

const COLUMN_TITLES: Readonly<Record<ColumnId, string>> = {
    customer: "Customer",
    freight: "Freight",
    orderDate: "Ordered",
    orderId: "Order ID",
    shipped: "Shipped"
};

const currency = new Intl.NumberFormat("en-US", { currency: "USD", style: "currency" });

const NUMBER_FORMATS: readonly { readonly text: string; readonly value: ColumnFormat | null }[] = [
    { text: "As it is", value: null },
    { text: "Currency ($42.50)", value: (value: unknown) => currency.format(Number(value)) },
    { text: "Rounded (43)", value: (value: unknown) => String(Math.round(Number(value))) }
];

const TEXT_FORMATS: readonly { readonly text: string; readonly value: ColumnFormat | null }[] = [
    { text: "As it is", value: null },
    { text: "Upper case", value: (value: unknown) => String(value).toUpperCase() }
];

const BOOLEAN_FORMATS: readonly { readonly text: string; readonly value: ColumnFormat | null }[] = [
    { text: "As it is", value: null },
    { text: "Yes or No", value: (value: unknown) => (value ? "Yes" : "No") }
];

const ROW_CLASSES: readonly { readonly text: string; readonly value: GridRowClass<OverviewOrder> | null }[] = [
    { text: "None", value: null },
    { text: "Dim unshipped orders", value: order => (order.shipped ? null : "opacity-60") },
    { text: "Bold heavy freight", value: order => (order.freight > 250 ? "font-semibold" : null) }
];

const PAGE_SIZE_VALUES: readonly { readonly text: string; readonly value: number[] }[] = [
    { text: "10, 20, 50", value: [10, 20, 50] },
    { text: "5, 10, 25, 100", value: [5, 10, 25, 100] },
    { text: "None (no page size picker)", value: [] }
];

const RESIZE_METHODS: readonly { readonly text: string; readonly value: ResizeMethod }[] = [
    { text: "fitView", value: "fitView" },
    { text: "auto", value: "auto" },
    { text: "120 (pixels)", value: 120 },
    { text: "200 (pixels)", value: 200 }
];

/**
 * The playground of the Grid Overview page. It covers every input of the grid and the display inputs of its columns,
 * and the templates the grid and its columns take. The feature directives have playgrounds of their own on their
 * pages, and this one shares nothing with them.
 */
@Component({
    selector: "app-grid-overview-demo",
    imports: [
        ChipComponent,
        GridCellTemplateDirective,
        GridColumnComponent,
        GridColumnTitleTemplateDirective,
        GridComponent,
        GridHeaderTemplateDirective,
        GridNoDataTemplateDirective,
        GridToolbarTemplateDirective,
        PartsDemoContainerComponent,
        SegmentedComponent
    ],
    templateUrl: "./grid-overview-demo.component.html"
})
export class GridOverviewDemoComponent {
    readonly #columnFeatures: Readonly<Record<ColumnId, FeatureConfigHandler>> = {
        customer: this.#features({
            headerTemplate: {
                name: "Header template",
                description: "Replaces the whole header text with your own markup. It wins over a title template.",
                active: false,
                code: `
                    <ng-template monaGridHeaderTemplate let-column>
                        <span class="uppercase tracking-wide">{{ column.title }}</span>
                    </ng-template>`
            }
        }),
        freight: this.#features({
            cellTemplate: {
                name: "Cell template",
                description: "Replaces the cell text with your own markup. A format is then not used.",
                active: false,
                code: `
                    <ng-template monaGridCellTemplate let-order>
                        <mona-chip size="small" [look]="order.freight > 250 ? 'error' : 'info'">
                            {{ order.freight }} kg
                        </mona-chip>
                    </ng-template>`
            }
        }),
        orderDate: this.#features({}),
        orderId: this.#features({
            titleTemplate: {
                name: "Title template",
                description: "Replaces the title text in the header, and keeps the header's sort and filter buttons.",
                active: false,
                code: `
                    <span monaGridColumnTitleTemplate>
                        Order <abbr title="number">#</abbr>
                    </span>`
            }
        }),
        shipped: this.#features({})
    };
    readonly #gridFeatures = this.#features({
        toolbarTemplate: {
            name: "Toolbar template",
            description: "Adds a toolbar above the headers. The toolbar also shows the built-in Columns button.",
            active: true,
            code: `
                <ng-template monaGridToolbarTemplate>
                    <span class="text-sm font-medium">Orders</span>
                </ng-template>`
        },
        noDataTemplate: {
            name: "No data template",
            description: "What the body shows without rows. Pick the empty data set to see it.",
            active: false,
            code: `
                <ng-template monaGridNoDataTemplate>
                    <span>No orders yet</span>
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
    protected readonly columnFeatures = computed(() => ({
        customer: this.#columnFeatures.customer.data(),
        freight: this.#columnFeatures.freight.data(),
        orderId: this.#columnFeatures.orderId.data()
    }));
    protected readonly columns = computed(() => {
        const values = this.values();
        const read = (id: ColumnId) => readPartValues<GridColumnComponent>(this.#part(id), values);
        return {
            customer: read("customer"),
            freight: read("freight"),
            orderDate: read("orderDate"),
            orderId: read("orderId"),
            shipped: read("shipped")
        };
    });
    protected readonly data = computed(() => overviewOrders(this.dataSet()));
    protected readonly dataSet = signal<OverviewDataSet>("orders");
    protected readonly dataSetOptions: readonly SegmentedOption<OverviewDataSet>[] = [
        { label: "120 orders", value: "orders" },
        { label: "3 orders", value: "few" },
        { label: "Empty", value: "empty" }
    ];
    protected readonly eventLog = new DemoEventLog();
    protected readonly grid = computed(() => readPartValues<GridComponent<unknown>>(this.#part("grid"), this.values()));
    protected readonly gridFeatures = this.#gridFeatures.data;
    protected readonly parts = computed<readonly DemoPart[]>(() => {
        const metadata = this.#metadata();
        const gridMetadata = metadata["GridComponent"] ?? emptyMetadata();
        const columnMetadata = metadata["GridColumnComponent"] ?? emptyMetadata();
        return [
            {
                id: "grid",
                title: "Grid",
                metadata: gridMetadata,
                codeAttributes: ['[data]="orders"', 'rowKey="orderId"', 'class="h-112"'],
                config: {
                    inputs: deriveInputConfig<GridComponent<unknown>>(gridMetadata, gridOverrides(), {
                        resolveAliases: true
                    }),
                    featureHandler: this.#gridFeatures
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
                    featureHandler: this.#columnFeatures[column.id]
                }
            }))
        ];
    });
    /** The panels come from metadata that loads after the page; until then the grid would get no settings. */
    protected readonly ready = computed(() => this.parts().every(part => (part.metadata.inputs ?? []).length > 0));
    protected readonly values = linkedSignal<readonly DemoPart[], DemoPartValues>({
        source: this.parts,
        computation: (parts, previous) => reconcilePartValues(parts, previous?.value)
    });

    protected onDataSetChange(set: OverviewDataSet | null): void {
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

function gridOverrides(): Partial<ComponentConfigInputType<GridComponent<unknown>>> {
    return {
        ariaLabel: { alias: "aria-label", type: "string", value: "Orders" },
        ariaLabelledBy: undefined,
        data: undefined,
        expandedKeys: undefined,
        pageSize: { type: "number", value: 10, min: 1, nullable: false },
        pageSizeValues: {
            type: "customDropdown",
            value: PAGE_SIZE_VALUES,
            textField: "text",
            valueField: "value",
            defaultValue: PAGE_SIZE_VALUES[0].value
        },
        resizeMethod: {
            type: "customDropdown",
            value: RESIZE_METHODS,
            textField: "text",
            valueField: "value",
            defaultValue: "fitView",
            note: "How columns without a width get theirs. A number gives each of them that many pixels."
        },
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

/** The display inputs. Sorting, filtering, editing, aggregates, locking and state keys have pages of their own. */
function columnOverrides(id: ColumnId): Partial<ComponentConfigInputType<GridColumnComponent>> {
    const formats =
        id === "orderDate"
            ? {
                  type: "dropdown" as const,
                  value: ["MMM d, y", "yyyy-MM-dd", "dd/MM/yyyy", "EEEE, MMMM d"],
                  defaultValue: null,
                  clearable: true,
                  placeholder: "Locale default",
                  note: "A date format string, in Angular's formatDate patterns."
              }
            : {
                  type: "customDropdown" as const,
                  value: id === "shipped" ? BOOLEAN_FORMATS : id === "customer" ? TEXT_FORMATS : NUMBER_FORMATS,
                  textField: "text",
                  valueField: "value",
                  defaultValue: null,
                  note: "A function from the value, row and column to the cell text."
              };
    return {
        aggregate: undefined,
        editable: undefined,
        field: undefined,
        filterable: undefined,
        format: formats,
        locked: undefined,
        lockedPosition: undefined,
        maxWidth: { type: "number", nullable: true, value: null, min: 40 },
        minWidth: { type: "number", nullable: false, value: 40, min: 0 },
        sortComparator: undefined,
        sortable: undefined,
        stateKey: undefined,
        title: { type: "string", value: COLUMN_TITLES[id] },
        type: undefined,
        width: { type: "number", nullable: true, value: id === "orderId" ? 110 : null, min: 40 }
    };
}
