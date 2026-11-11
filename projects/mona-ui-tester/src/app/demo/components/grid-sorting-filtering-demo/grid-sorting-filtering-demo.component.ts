import { Component, computed, inject, Injector, linkedSignal, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import {
    GridColumnComponent,
    GridComponent,
    GridFilterableDirective,
    GridSortableDirective
} from "@nanahoshi/mona-ui/grid";
import type {
    ColumnSortComparator,
    ColumnSortEvent,
    FilterableOptions,
    SortableOptions
} from "@nanahoshi/mona-ui/grid";
import type { CompositeFilterDescriptor, SortDescriptor } from "@nanahoshi/mona-ui/query";
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
import { sortingFilteringOrders } from "./grid-sorting-filtering-demo.data";

type ColumnId = "country" | "customer" | "freight" | "orderDate" | "orderId";

type Preset = "freight" | "germany" | "newest" | "none";

interface ColumnSpec {
    readonly code: readonly string[];
    readonly id: ColumnId;
    readonly title: string;
}

const COLUMNS: readonly ColumnSpec[] = [
    { id: "orderId", title: "Order ID column", code: ['field="orderId"', 'type="number"'] },
    { id: "customer", title: "Customer column", code: ['field="customer"'] },
    { id: "country", title: "Country column", code: ['field="country"'] },
    { id: "freight", title: "Freight column", code: ['field="freight"', 'type="number"'] },
    { id: "orderDate", title: "Order date column", code: ['field="orderDate"', 'type="date"'] }
];

const COLUMN_TITLES: Readonly<Record<ColumnId, string>> = {
    country: "Country",
    customer: "Customer",
    freight: "Freight",
    orderDate: "Ordered",
    orderId: "Order ID"
};

const text = (value: unknown): string => (value == null ? "" : String(value));

const SORT_COMPARATORS: readonly { readonly text: string; readonly value: ColumnSortComparator | null }[] = [
    { text: "Default", value: null },
    {
        text: "Ignore case and accents",
        value: (left, right) => text(left).localeCompare(text(right), undefined, { sensitivity: "base" })
    },
    { text: "By length", value: (left, right) => text(left).length - text(right).length }
];

const PRESETS: Readonly<
    Record<Preset, { readonly filter: CompositeFilterDescriptor[]; readonly sort: SortDescriptor[] }>
> = {
    freight: {
        filter: [{ logic: "and", filters: [{ field: "freight", operator: "gt", value: 100 }] }],
        sort: []
    },
    germany: {
        filter: [{ logic: "and", filters: [{ field: "country", operator: "eq", value: "Germany" }] }],
        sort: []
    },
    newest: { filter: [], sort: [{ field: "orderDate", dir: "desc" }] },
    none: { filter: [], sort: [] }
};

/**
 * The playground of the Grid Sorting & Filtering page. It covers the options of `monaGridSortable` and
 * `monaGridFilterable`, their `sort` and `filter` models, and the column inputs that opt a column out or change how it
 * sorts. It shares nothing with the other grid playgrounds.
 */
@Component({
    selector: "app-grid-sorting-filtering-demo",
    imports: [
        GridColumnComponent,
        GridComponent,
        GridFilterableDirective,
        GridSortableDirective,
        PartsDemoContainerComponent,
        SegmentedComponent
    ],
    templateUrl: "./grid-sorting-filtering-demo.component.html"
})
export class GridSortingFilteringDemoComponent {
    readonly #filteringFeatures = this.#features({
        filterable: {
            name: "Filtering options",
            description:
                "Binds an options object to monaGridFilterable. Off leaves the bare attribute and its defaults.",
            active: true,
            directiveBinding: { hostAttribute: "monaGridFilterable", buildValue: features => readFilterable(features) },
            subFeatures: {
                enabled: {
                    name: "Enabled",
                    description: "Filter at all. Off keeps the filter model's rows.",
                    active: true
                },
                type: {
                    name: "Type",
                    description: "A menu in each header, a row of inputs under the headers, or both.",
                    type: "dropdown",
                    dropdownDataSource: ["menu", "row", "menu, row"],
                    dropdownValue: "menu"
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
    readonly #sortingFeatures = this.#features({
        sortable: {
            name: "Sorting options",
            description: "Binds an options object to monaGridSortable. Off leaves the bare attribute and its defaults.",
            active: true,
            directiveBinding: { hostAttribute: "monaGridSortable", buildValue: features => readSortable(features) },
            subFeatures: {
                mode: {
                    name: "Mode",
                    description: "Sort by one column at a time, or add each clicked column to the sort.",
                    type: "dropdown",
                    dropdownDataSource: ["single", "multiple"],
                    dropdownValue: "single"
                },
                allowUnsort: {
                    name: "Allow unsort",
                    description: "A third click clears the column's sort. Off cycles between ascending and descending.",
                    active: true
                },
                showIndices: {
                    name: "Show indices",
                    description: "Numbers the sorted headers in multiple mode.",
                    active: true
                },
                enabled: { name: "Enabled", description: "Sort at all. Off ignores header clicks.", active: true }
            }
        }
    });
    protected readonly columns = computed(() => {
        const values = this.values();
        const read = (id: ColumnId) => readPartValues<GridColumnComponent>(this.#part(id), values);
        return {
            country: read("country"),
            customer: read("customer"),
            freight: read("freight"),
            orderDate: read("orderDate"),
            orderId: read("orderId")
        };
    });
    protected readonly data = sortingFilteringOrders();
    protected readonly eventLog = new DemoEventLog();
    protected readonly filter = signal<CompositeFilterDescriptor[]>([]);
    protected readonly filterableOptions = computed(() => readFilterable(this.#filteringFeatures.data()));
    protected readonly grid = computed(() => readPartValues<GridComponent<unknown>>(this.#part("grid"), this.values()));
    protected readonly parts = computed<readonly DemoPart[]>(() => {
        const metadata = this.#metadata();
        const gridMetadata = metadata["GridComponent"] ?? emptyMetadata();
        const sortableMetadata = metadata["GridSortableDirective"] ?? emptyMetadata();
        const filterableMetadata = metadata["GridFilterableDirective"] ?? emptyMetadata();
        const columnMetadata = metadata["GridColumnComponent"] ?? emptyMetadata();
        return [
            {
                id: "grid",
                title: "Grid",
                metadata: gridMetadata,
                codeAttributes: ['[data]="orders"', 'class="h-112"'],
                config: {
                    inputs: deriveInputConfig<GridComponent<unknown>>(gridMetadata, gridOverrides(), {
                        resolveAliases: true
                    })
                }
            },
            {
                id: "sorting",
                title: "Sorting",
                metadata: sortableMetadata,
                placement: "host",
                codeAttributes: ['[(sort)]="sort"'],
                config: {
                    inputs: deriveInputConfig<GridSortableDirective>(
                        sortableMetadata,
                        { options: undefined, sort: undefined },
                        { resolveAliases: true }
                    ),
                    featureHandler: this.#sortingFeatures
                }
            },
            {
                id: "filtering",
                title: "Filtering",
                metadata: filterableMetadata,
                placement: "host",
                codeAttributes: ['[(filter)]="filter"'],
                config: {
                    inputs: deriveInputConfig<GridFilterableDirective>(
                        filterableMetadata,
                        { filter: undefined, options: undefined },
                        { resolveAliases: true }
                    ),
                    featureHandler: this.#filteringFeatures
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
    protected readonly preset = signal<Preset>("none");
    protected readonly presetOptions: readonly SegmentedOption<Preset>[] = [
        { label: "None", value: "none" },
        { label: "Newest first", value: "newest" },
        { label: "Freight over 100", value: "freight" },
        { label: "Shipped to Germany", value: "germany" }
    ];
    /** The panels come from metadata that loads after the page; until then the grid would get no settings. */
    protected readonly ready = computed(() => this.parts().every(part => (part.metadata.inputs ?? []).length > 0));
    protected readonly sort = signal<SortDescriptor[]>([]);
    protected readonly sortableOptions = computed(() => readSortable(this.#sortingFeatures.data()));
    protected readonly values = linkedSignal<readonly DemoPart[], DemoPartValues>({
        source: this.parts,
        computation: (parts, previous) => reconcilePartValues(parts, previous?.value)
    });

    protected onColumnSort(event: ColumnSortEvent): void {
        this.eventLog.record("columnSort", { field: event.column.field, direction: event.column.columnSortDirection });
    }

    protected onFilterChange(filter: CompositeFilterDescriptor[]): void {
        this.filter.set(filter);
        this.eventLog.record("filterChange", filter);
    }

    protected onPresetChange(preset: Preset | null): void {
        if (!preset) {
            return;
        }
        this.preset.set(preset);
        this.sort.set(PRESETS[preset].sort);
        this.filter.set(PRESETS[preset].filter);
    }

    protected onSortChange(sort: SortDescriptor[]): void {
        this.sort.set(sort);
        this.eventLog.record("sortChange", sort);
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

function subFeature(features: ComponentConfigFeatureItem, key: string, name: string) {
    return features[key]?.subFeatures?.[name];
}

function readSortable(features: ComponentConfigFeatureItem): SortableOptions | "" {
    if (!features["sortable"]?.active) {
        return "";
    }
    const read = (name: string) => subFeature(features, "sortable", name);
    return {
        allowUnsort: read("allowUnsort")?.active ?? true,
        enabled: read("enabled")?.active ?? true,
        mode: (read("mode")?.dropdownValue as SortableOptions["mode"]) ?? "single",
        showIndices: read("showIndices")?.active ?? true
    };
}

function readFilterable(features: ComponentConfigFeatureItem): Partial<FilterableOptions> | "" {
    if (!features["filterable"]?.active) {
        return "";
    }
    const read = (name: string) => subFeature(features, "filterable", name);
    return {
        enabled: read("enabled")?.active ?? true,
        type: (read("type")?.dropdownValue as FilterableOptions["type"]) ?? "menu"
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

/** Whether a column sorts and filters, and how it sorts. The display inputs belong to the Overview and Columns pages. */
function columnOverrides(id: ColumnId): Partial<ComponentConfigInputType<GridColumnComponent>> {
    return {
        aggregate: undefined,
        editable: undefined,
        field: undefined,
        filterable: { type: "boolean", value: true, note: "Off removes the column's filter menu and filter cell." },
        format: undefined,
        hidden: undefined,
        locked: undefined,
        lockedPosition: undefined,
        maxWidth: undefined,
        minWidth: undefined,
        sortComparator:
            id === "customer"
                ? {
                      type: "customDropdown",
                      value: SORT_COMPARATORS,
                      textField: "text",
                      valueField: "value",
                      defaultValue: null,
                      note: "Compares two values of the field. It is used from the next header click."
                  }
                : undefined,
        sortable: { type: "boolean", value: true, note: "Off ignores clicks on the column's header." },
        stateKey: undefined,
        title: { type: "string", value: COLUMN_TITLES[id] },
        type: undefined,
        width: undefined
    };
}
