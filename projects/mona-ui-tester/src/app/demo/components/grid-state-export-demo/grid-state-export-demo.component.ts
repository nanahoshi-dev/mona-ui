import { JsonPipe } from "@angular/common";
import { Component, computed, DOCUMENT, inject, Injector, linkedSignal, signal, viewChild } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    GridColumnComponent,
    GridComponent,
    GridExportDirective,
    GridFilterableDirective,
    GridGroupableDirective,
    GridReorderableDirective,
    GridResizableDirective,
    GridSortableDirective,
    GridStatePersistenceDirective
} from "@nanahoshi/mona-ui/grid";
import type { GridState, GridStateLoadResult, GridStatePersistenceOptions } from "@nanahoshi/mona-ui/grid";
import { filter, map } from "rxjs";
import type { ComponentMetadata } from "../../models/ComponentMetadata";
import { DemoService } from "../../services/demo.service";
import type { ComponentConfigFeatureItem, ComponentConfigInputType } from "../../utils/componentConfig";
import { DemoEventLog, readPartValues, reconcilePartValues } from "../../utils/demoParts";
import type { DemoPart, DemoPartValues } from "../../utils/demoParts";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { PartsDemoContainerComponent } from "../parts-demo-container/parts-demo-container.component";
import { stateExportOrders } from "./grid-state-export-demo.data";

type ColumnId = "city" | "customer" | "orderId" | "product" | "quantity";

interface ColumnSpec {
    readonly code: readonly string[];
    readonly id: ColumnId;
    readonly title: string;
}

const COLUMNS: readonly ColumnSpec[] = [
    { id: "orderId", title: "Order ID column", code: ['field="orderId"', 'type="number"'] },
    { id: "customer", title: "Customer column", code: ['field="customer"'] },
    { id: "product", title: "Product column", code: ['field="product"'] },
    { id: "city", title: "City column", code: ['field="city"'] },
    { id: "quantity", title: "Quantity column", code: ['field="quantity"', 'type="number"'] }
];

const COLUMN_TITLES: Readonly<Record<ColumnId, string>> = {
    city: "City",
    customer: "Customer",
    orderId: "Order ID",
    product: "Product",
    quantity: "Quantity"
};

/** Where "Save to this browser" keeps the state. */
export const GRID_STATE_STORAGE_KEY = "mona-docs-grid-state";

const DEFAULT_FILE_NAME = "orders.csv";

/** The export directive has no inputs, so the metadata extractor leaves it out. */
const EXPORT_METADATA: ComponentMetadata = {
    inputs: [],
    name: "GridExportDirective",
    selector: "mona-grid[monaGridExport]"
};

/**
 * The playground of the Grid's State & Export page. Sorting, filtering, grouping, reordering and resizing are on, so
 * there is state to capture, save to the browser and restore; the export writes the current view as CSV. It shares
 * nothing with the other grid playgrounds.
 */
@Component({
    selector: "app-grid-state-export-demo",
    imports: [
        ButtonDirective,
        GridColumnComponent,
        GridComponent,
        GridExportDirective,
        GridFilterableDirective,
        GridGroupableDirective,
        GridReorderableDirective,
        GridResizableDirective,
        GridSortableDirective,
        GridStatePersistenceDirective,
        JsonPipe,
        PartsDemoContainerComponent
    ],
    templateUrl: "./grid-state-export-demo.component.html"
})
export class GridStateExportDemoComponent {
    readonly #document = inject(DOCUMENT);
    readonly #exportFeatures = this.#features({
        button: {
            name: "Export button",
            description: "The Export as CSV button under the grid, which calls gridExport.exportCsv(fileName).",
            active: true,
            hasCode: false,
            subFeatures: {
                fileName: {
                    name: "File name",
                    description: "The name of the downloaded file.",
                    type: "string",
                    stringValue: DEFAULT_FILE_NAME,
                    hasCode: false
                }
            }
        }
    });
    readonly #metadata = toSignal(
        inject(DemoService).metadata$.pipe(
            filter(metadata => !!metadata),
            map(metadata => metadata ?? {})
        ),
        { initialValue: {} as Record<string, ComponentMetadata> }
    );
    readonly #persistenceFeatures = this.#features({
        options: {
            name: "Options object",
            description: "Binds an options object to monaGridStatePersistence. Off writes the bare attribute.",
            active: true,
            directiveBinding: {
                hostAttribute: "monaGridStatePersistence",
                buildValue: features => readPersistenceOptions(features)
            },
            subFeatures: {
                enabled: {
                    name: "Enabled",
                    description: "Off stops capturing the state and applying a bound one.",
                    active: true
                },
                persistPageSize: {
                    name: "Persist page size",
                    description: "Keeps the page size in the state.",
                    active: true
                },
                schemaVersion: {
                    name: "Schema version",
                    description: "Your version tag. A saved state with another one is rejected on restore.",
                    type: "number",
                    numericValue: 1,
                    numericMin: 1
                }
            }
        }
    });
    private readonly exportDirective = viewChild(GridExportDirective);
    private readonly persistence = viewChild(GridStatePersistenceDirective);
    protected readonly columns = computed(() => {
        const values = this.values();
        const read = (id: ColumnId) => readPartValues<GridColumnComponent>(this.#part(id), values);
        return {
            city: read("city"),
            customer: read("customer"),
            orderId: read("orderId"),
            product: read("product"),
            quantity: read("quantity")
        };
    });
    protected readonly eventLog = new DemoEventLog();
    protected readonly exportButton = computed(() => {
        const button = this.#exportFeatures.data()["button"];
        return {
            fileName: button?.subFeatures?.["fileName"]?.stringValue?.trim() || DEFAULT_FILE_NAME,
            visible: button?.active === true
        };
    });
    /** Bumped by Reset, which renders a new grid so every setting goes back to its default. */
    protected readonly generation = signal(0);
    protected readonly grid = computed(() => readPartValues<GridComponent<unknown>>(this.#part("grid"), this.values()));
    protected readonly orders = stateExportOrders();
    protected readonly pageSizeValues = [10, 20, 50];
    protected readonly parts = computed<readonly DemoPart[]>(() => {
        const metadata = this.#metadata();
        const gridMetadata = metadata["GridComponent"] ?? emptyMetadata();
        const columnMetadata = metadata["GridColumnComponent"] ?? emptyMetadata();
        const persistenceMetadata = metadata["GridStatePersistenceDirective"] ?? emptyMetadata();
        const exportMetadata = metadata["GridExportDirective"] ?? EXPORT_METADATA;
        return [
            {
                id: "grid",
                title: "Grid",
                metadata: gridMetadata,
                codeAttributes: [
                    '[data]="orders"',
                    'rowKey="orderId"',
                    'class="h-112"',
                    '[pageSizeValues]="[10, 20, 50]"',
                    "monaGridSortable",
                    "[monaGridFilterable]=\"{ enabled: true, type: 'menu' }\"",
                    "monaGridGroupable",
                    "monaGridReorderable",
                    "monaGridResizable"
                ],
                config: {
                    inputs: deriveInputConfig<GridComponent<unknown>>(gridMetadata, gridOverrides(), {
                        resolveAliases: true
                    })
                }
            },
            {
                id: "statePersistence",
                title: "State persistence",
                placement: "host",
                metadata: persistenceMetadata,
                codeAttributes: ['[(state)]="state"'],
                config: {
                    inputs: deriveInputConfig<GridStatePersistenceDirective>(persistenceMetadata, {
                        options: undefined,
                        state: undefined
                    }),
                    featureHandler: this.#persistenceFeatures
                }
            },
            {
                id: "export",
                title: "Export",
                placement: "host",
                metadata: exportMetadata,
                codeAttributes: ['#gridExport="monaGridExport"'],
                config: {
                    inputs: {} as ComponentConfigInputType<GridExportDirective>,
                    featureHandler: this.#exportFeatures
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
                    })
                }
            }))
        ];
    });
    protected readonly persistenceOptions = computed(() => readPersistenceOptions(this.#persistenceFeatures.data()));
    /**
     * The panels come from metadata that loads after the page; until then the grid would get no settings. The export
     * directive has no inputs, so it isn't waited on.
     */
    protected readonly ready = computed(() =>
        this.parts()
            .filter(part => part.id !== "export")
            .every(part => (part.metadata.inputs ?? []).length > 0)
    );
    protected readonly state = signal<GridState | null>(null);
    protected readonly status = signal("");
    protected readonly values = linkedSignal<readonly DemoPart[], DemoPartValues>({
        source: this.parts,
        computation: (parts, previous) => reconcilePartValues(parts, previous?.value)
    });

    protected onExport(): void {
        this.exportDirective()?.exportCsv(this.exportButton().fileName);
    }

    protected onPageSizeChange(pageSize: number | undefined): void {
        this.values.update(values => ({ ...values, grid: { ...values["grid"], pageSize } }));
        this.eventLog.record("pageSizeChange", pageSize);
    }

    protected onReset(): void {
        this.state.set(null);
        this.values.update(values => ({ ...values, grid: { ...values["grid"], pageSize: 10 } }));
        this.generation.update(generation => generation + 1);
        this.status.set("The grid is back to its defaults. The saved state is still in this browser.");
    }

    protected onRestore(): void {
        const saved = this.#readSavedState();
        if (saved === undefined) {
            this.status.set("Nothing is saved in this browser yet.");
            return;
        }
        const result = this.persistence()?.loadState(saved);
        this.status.set(describeLoadResult(result));
    }

    protected onSave(): void {
        const state = this.state() ?? this.persistence()?.captureState() ?? null;
        try {
            const storage = this.#document.defaultView?.localStorage;
            if (!storage) {
                throw new Error("No storage");
            }
            storage.setItem(GRID_STATE_STORAGE_KEY, JSON.stringify(state));
            this.status.set("Saved the state to this browser.");
        } catch {
            this.status.set("This browser didn't let the page save the state.");
        }
    }

    protected onStateChange(state: GridState | null): void {
        this.state.set(state);
        this.eventLog.record("stateChange", state);
    }

    #features(data: ComponentConfigFeatureItem): FeatureConfigHandler {
        return createFeatureInjector(data, inject(Injector)).get(FeatureConfigHandler);
    }

    #part(id: string): DemoPart | undefined {
        return this.parts().find(part => part.id === id);
    }

    /** The saved state, `null` when an empty state was saved, or `undefined` when nothing could be read. */
    #readSavedState(): GridState | null | undefined {
        try {
            const text = this.#document.defaultView?.localStorage.getItem(GRID_STATE_STORAGE_KEY);
            return text == null ? undefined : (JSON.parse(text) as GridState | null);
        } catch {
            return undefined;
        }
    }
}

function describeLoadResult(result: GridStateLoadResult | undefined): string {
    switch (result?.status) {
        case "applied":
            return "Restored the saved state.";
        case "empty":
            return "The saved state is empty, so nothing changed.";
        case "rejected-schema":
            return "The saved state has another schema version, so the grid rejected it.";
        case "rejected-version":
            return "The saved state is from another version of the grid, so it was rejected.";
        case "rejected-invalid":
            return "The saved state isn't well formed, so the grid rejected it.";
        default:
            return "The grid isn't ready yet.";
    }
}

function readPersistenceOptions(features: ComponentConfigFeatureItem): GridStatePersistenceOptions | "" {
    const options = features["options"];
    if (!options?.active) {
        return "";
    }
    const read = (name: string) => options.subFeatures?.[name];
    const schemaVersion = read("schemaVersion")?.numericValue;
    return {
        enabled: read("enabled")?.active ?? true,
        persistPageSize: read("persistPageSize")?.active ?? true,
        ...(schemaVersion == null ? {} : { schemaVersion })
    };
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
