import { JsonPipe } from "@angular/common";
import {
    Component,
    computed,
    DestroyRef,
    effect,
    inject,
    Injector,
    linkedSignal,
    type OnInit,
    signal,
    untracked
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import type { VirtualScrollOptions } from "@nanahoshi/mona-ui/common";
import {
    GridColumnComponent,
    GridComponent,
    GridFilterableDirective,
    GridServerBindingDirective,
    GridSortableDirective,
    GridVirtualScrollDirective
} from "@nanahoshi/mona-ui/grid";
import type { GridDataState } from "@nanahoshi/mona-ui/grid";
import type { CompositeFilterDescriptor, SortDescriptor } from "@nanahoshi/mona-ui/query";
import { SegmentedComponent } from "@nanahoshi/mona-ui/segmented";
import type { SegmentedOption } from "@nanahoshi/mona-ui/segmented";
import { filter, map } from "rxjs";
import type { ComponentMetadata } from "../../models/ComponentMetadata";
import { DemoService } from "../../services/demo.service";
import type { ComponentConfigFeatureItem, ComponentConfigInputType } from "../../utils/componentConfig";
import { DemoEventLog, readPartValues, reconcilePartValues } from "../../utils/demoParts";
import type { DemoPart, DemoPartValues } from "../../utils/demoParts";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { PartsDemoContainerComponent } from "../parts-demo-container/parts-demo-container.component";
import { queryServerPage, serverOrders } from "./grid-server-demo.data";
import type { ServerOrder, ServerPage } from "./grid-server-demo.data";

type ColumnId = "customer" | "freight" | "orderId" | "shipCountry";

export type ServerDemoMode = "server" | "virtual";

interface ColumnSpec {
    readonly code: readonly string[];
    readonly id: ColumnId;
    readonly title: string;
}

const COLUMNS: readonly ColumnSpec[] = [
    { id: "orderId", title: "Order ID column", code: ['field="orderId"', 'type="number"'] },
    { id: "customer", title: "Customer column", code: ['field="customer"'] },
    { id: "shipCountry", title: "Ship country column", code: ['field="shipCountry"'] },
    { id: "freight", title: "Freight column", code: ['field="freight"', 'type="number"'] }
];

const COLUMN_TITLES: Readonly<Record<ColumnId, string>> = {
    customer: "Customer",
    freight: "Freight",
    orderId: "Order ID",
    shipCountry: "Ship country"
};

/** How many rows a scroll end appends while "Load more on scroll end" is on. */
const LOAD_MORE_COUNT = 500;

/**
 * The playground of the Grid's Server Binding & Virtualization page. The two can't be combined, so a mode picks one:
 * a mock server that pages, sorts and filters, or a large local data set rendered with virtual scrolling. It shares
 * nothing with the other grid playgrounds.
 */
@Component({
    selector: "app-grid-server-demo",
    imports: [
        GridColumnComponent,
        GridComponent,
        GridFilterableDirective,
        GridServerBindingDirective,
        GridSortableDirective,
        GridVirtualScrollDirective,
        JsonPipe,
        PartsDemoContainerComponent,
        SegmentedComponent
    ],
    templateUrl: "./grid-server-demo.component.html"
})
export class GridServerDemoComponent implements OnInit {
    readonly #destroyRef = inject(DestroyRef);
    readonly #injector = inject(Injector);
    readonly #metadata = toSignal(
        inject(DemoService).metadata$.pipe(
            filter(metadata => !!metadata),
            map(metadata => metadata ?? {})
        ),
        { initialValue: {} as Record<string, ComponentMetadata> }
    );
    readonly #serverFeatures = this.#features({
        latency: {
            name: "Latency",
            description: "How long the mock server takes to answer, in milliseconds.",
            type: "number",
            numericValue: 400,
            numericMin: 0,
            numericMax: 5000,
            hasCode: false
        },
        failEveryThird: {
            name: "Fail every third request",
            description: "Shows error handling: loading goes back to false and the grid keeps the rows it had.",
            active: false,
            hasCode: false
        }
    });
    readonly #timers = new Set<ReturnType<typeof setTimeout>>();
    readonly #virtualFeatures = this.#features({
        options: {
            name: "Options object",
            description: "Binds an options object to monaGridVirtualScroll. Off writes the bare attribute.",
            active: true,
            directiveBinding: {
                hostAttribute: "monaGridVirtualScroll",
                buildValue: features => readVirtualScroll(features)
            },
            subFeatures: {
                enabled: {
                    name: "Enabled",
                    description: "Off renders every row again, with a pager.",
                    active: true
                },
                height: {
                    name: "Row height",
                    description: "The fixed height of every row, in pixels.",
                    type: "number",
                    numericValue: 36,
                    numericMin: 24
                }
            }
        },
        loadMore: {
            name: "Load more on scroll end",
            description: `Appends ${LOAD_MORE_COUNT} rows each time scrollEnd fires.`,
            active: true,
            hasCode: false
        }
    });
    #requestId = 0;
    protected readonly columns = computed(() => {
        const values = this.values();
        const read = (id: ColumnId) => readPartValues<GridColumnComponent>(this.#part(id), values);
        return {
            customer: read("customer"),
            freight: read("freight"),
            orderId: read("orderId"),
            shipCountry: read("shipCountry")
        };
    });
    protected readonly error = signal<string | null>(null);
    protected readonly eventLog = new DemoEventLog();
    protected readonly filter = signal<CompositeFilterDescriptor[]>([]);
    protected readonly grid = computed(() => readPartValues<GridComponent<unknown>>(this.#part("grid"), this.values()));
    protected readonly loading = signal(false);
    protected readonly mode = signal<ServerDemoMode>("server");
    protected readonly modeOptions: readonly SegmentedOption<ServerDemoMode>[] = [
        { label: "Server pages", value: "server" },
        { label: "Virtual scrolling", value: "virtual" }
    ];
    protected readonly page = signal<ServerPage>({ data: [], total: 0 });
    protected readonly parts = computed<readonly DemoPart[]>(() => {
        const metadata = this.#metadata();
        const server = this.mode() === "server";
        const gridMetadata = metadata["GridComponent"] ?? emptyMetadata();
        const columnMetadata = metadata["GridColumnComponent"] ?? emptyMetadata();
        const hostMetadata =
            metadata[server ? "GridServerBindingDirective" : "GridVirtualScrollDirective"] ?? emptyMetadata();
        const host: DemoPart = server
            ? {
                  id: "serverBinding",
                  title: "Server binding",
                  placement: "host",
                  metadata: hostMetadata,
                  codeAttributes: [
                      '[total]="total()"',
                      '[skip]="skip()"',
                      '[loading]="loading()"',
                      '(dataStateChange)="load($event)"'
                  ],
                  config: {
                      inputs: deriveInputConfig<GridServerBindingDirective>(hostMetadata, {
                          loading: undefined,
                          skip: undefined,
                          total: undefined
                      }),
                      featureHandler: this.#serverFeatures
                  }
              }
            : {
                  id: "virtualScroll",
                  title: "Virtual scrolling",
                  placement: "host",
                  metadata: hostMetadata,
                  codeAttributes: ['(scrollEnd)="loadMore()"'],
                  config: {
                      inputs: deriveInputConfig<GridVirtualScrollDirective>(hostMetadata, {
                          options: undefined,
                          scrollEndThreshold: {
                              type: "number",
                              value: 5,
                              min: 0,
                              nullable: false,
                              note: "How many rows from the bottom scrollEnd fires."
                          }
                      }),
                      featureHandler: this.#virtualFeatures
                  }
              };
        return [
            {
                id: "grid",
                title: "Grid",
                metadata: gridMetadata,
                codeAttributes: server
                    ? [
                          '[data]="orders()"',
                          'rowKey="orderId"',
                          'class="h-112"',
                          "monaGridSortable",
                          '[(sort)]="sort"',
                          "[monaGridFilterable]=\"{ enabled: true, type: 'row' }\"",
                          '[(filter)]="filter"'
                      ]
                    : ['[data]="orders()"', 'rowKey="orderId"', 'class="h-112"'],
                config: {
                    inputs: deriveInputConfig<GridComponent<unknown>>(gridMetadata, gridOverrides(), {
                        resolveAliases: true
                    })
                }
            },
            host,
            ...COLUMNS.map((column): DemoPart => ({
                id: column.id,
                title: column.title,
                metadata: columnMetadata,
                codeAttributes: column.code,
                config: {
                    inputs: deriveInputConfig<GridColumnComponent>(columnMetadata, columnOverrides(column.id), {
                        resolveAliases: true
                    })
                }
            }))
        ];
    });
    /** The panels come from metadata that loads after the page; until then the grid would get no settings. */
    protected readonly ready = computed(() => this.parts().every(part => (part.metadata.inputs ?? []).length > 0));
    protected readonly requests = signal(0);
    protected readonly rowCount = signal(1000);
    protected readonly rowCountOptions: readonly SegmentedOption<number>[] = [
        { label: "1,000", value: 1000 },
        { label: "10,000", value: 10000 },
        { label: "100,000", value: 100000 }
    ];
    /** The local rows of virtual mode. Picking a row count starts over; a scroll end appends to them. */
    protected readonly rows = linkedSignal<number, readonly ServerOrder[]>({
        source: this.rowCount,
        computation: count => serverOrders(count)
    });
    protected readonly sort = signal<SortDescriptor[]>([]);
    protected readonly state = signal<GridDataState>({ filter: [], skip: 0, sort: [], take: 10 });
    protected readonly values = linkedSignal<readonly DemoPart[], DemoPartValues>({
        source: this.parts,
        computation: (parts, previous) => reconcilePartValues(parts, previous?.value)
    });
    protected readonly virtualOptions = computed(() => readVirtualScroll(this.#virtualFeatures.data()));
    protected readonly virtualScroll = computed(() =>
        readPartValues<GridVirtualScrollDirective>(this.#part("virtualScroll"), this.values())
    );

    public constructor() {
        this.#destroyRef.onDestroy(() => {
            for (const timer of this.#timers) {
                clearTimeout(timer);
            }
            this.#timers.clear();
        });
        // A page size set in the panel doesn't reach the server by itself: the grid only requests data for a user action.
        effect(() => {
            const pageSize = this.grid().pageSize;
            untracked(() => {
                if (this.mode() === "server" && pageSize != null && pageSize !== this.state().take) {
                    void this.load({ ...this.state(), skip: 0, take: pageSize });
                }
            });
        });
    }

    public ngOnInit(): void {
        void this.load(this.state());
    }

    protected async load(state: GridDataState): Promise<void> {
        const requestId = ++this.#requestId;
        const request = this.requests() + 1;
        this.requests.set(request);
        this.state.set(state);
        this.loading.set(true);
        this.error.set(null);
        try {
            const page = await this.#request(state, request);
            if (this.#isCurrent(requestId)) {
                this.page.set(page);
            }
        } catch (error: unknown) {
            if (this.#isCurrent(requestId)) {
                this.error.set(error instanceof Error ? error.message : String(error));
            }
        } finally {
            if (this.#isCurrent(requestId)) {
                this.loading.set(false);
            }
        }
    }

    protected onDataStateChange(state: GridDataState): void {
        this.eventLog.record("dataStateChange", state);
        void this.load(state);
    }

    protected onModeChange(mode: ServerDemoMode | null): void {
        if (mode) {
            this.mode.set(mode);
        }
    }

    protected onPageSizeChange(pageSize: number | undefined): void {
        this.values.update(values => ({ ...values, grid: { ...values["grid"], pageSize } }));
        this.eventLog.record("pageSizeChange", pageSize);
    }

    protected onRowCountChange(count: number | null): void {
        if (count) {
            this.rowCount.set(count);
        }
    }

    protected onScrollEnd(): void {
        this.eventLog.record("scrollEnd", undefined);
        if (this.#virtualFeatures.data()["loadMore"]?.active) {
            this.rows.update(rows => [...rows, ...serverOrders(LOAD_MORE_COUNT, rows.length)]);
        }
    }

    #features(data: ComponentConfigFeatureItem): FeatureConfigHandler {
        return createFeatureInjector(data, this.#injector).get(FeatureConfigHandler);
    }

    /** A response is used only while the playground is open and no newer request has started. */
    #isCurrent(requestId: number): boolean {
        return !this.#destroyRef.destroyed && requestId === this.#requestId;
    }

    #part(id: string): DemoPart | undefined {
        return this.parts().find(part => part.id === id);
    }

    /** The mock server: it answers after the latency, and fails every third request when asked to. */
    #request(state: GridDataState, request: number): Promise<ServerPage> {
        const features = this.#serverFeatures.data();
        const latency = Math.max(0, features["latency"]?.numericValue ?? 400);
        const fail = features["failEveryThird"]?.active === true && request % 3 === 0;
        return new Promise<ServerPage>((resolve, reject) => {
            const timer = setTimeout(() => {
                this.#timers.delete(timer);
                if (fail) {
                    reject(new Error(`Request ${request} failed. The grid kept its rows; try the action again.`));
                } else {
                    resolve(queryServerPage(state));
                }
            }, latency);
            this.#timers.add(timer);
        });
    }
}

function emptyMetadata(): ComponentMetadata {
    return { inputs: [], name: "", selector: "" };
}

function readVirtualScroll(features: ComponentConfigFeatureItem): Partial<VirtualScrollOptions> | "" {
    const options = features["options"];
    if (!options?.active) {
        return "";
    }
    return {
        enabled: options.subFeatures?.["enabled"]?.active ?? true,
        height: options.subFeatures?.["height"]?.numericValue ?? 36
    };
}

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
        rowClass: undefined,
        rowKey: undefined,
        skip: undefined,
        userClass: undefined
    };
}

/** Only the title: the field and type are fixed, and the display inputs are on the Overview page. */
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
