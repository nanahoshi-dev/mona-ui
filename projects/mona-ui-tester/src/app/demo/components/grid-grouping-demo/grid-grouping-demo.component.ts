import { Component, computed, inject, Injector, linkedSignal, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import {
    GridColumnComponent,
    GridComponent,
    GridFooterTemplateDirective,
    GridGroupableDirective,
    GridGroupFooterTemplateDirective,
    GridSortableDirective
} from "@nanahoshi/mona-ui/grid";
import type { AggregateFunction, GroupableOptions, GroupDescriptor } from "@nanahoshi/mona-ui/grid";
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
import { groupingOrders } from "./grid-grouping-demo.data";

type ColumnId = "country" | "customer" | "freight" | "quantity" | "shipped";

type GroupPreset = "country" | "countryShipped" | "none";

interface ColumnSpec {
    readonly code: readonly string[];
    readonly id: ColumnId;
    readonly title: string;
}

const COLUMNS: readonly ColumnSpec[] = [
    { id: "customer", title: "Customer column", code: ['field="customer"'] },
    { id: "country", title: "Country column", code: ['field="country"'] },
    { id: "shipped", title: "Shipped column", code: ['field="shipped"', 'type="boolean"'] },
    { id: "quantity", title: "Quantity column", code: ['field="quantity"', 'type="number"'] },
    { id: "freight", title: "Freight column", code: ['field="freight"', 'type="number"'] }
];

const COLUMN_TITLES: Readonly<Record<ColumnId, string>> = {
    country: "Country",
    customer: "Customer",
    freight: "Freight",
    quantity: "Quantity",
    shipped: "Shipped"
};

const NUMERIC_AGGREGATES: AggregateFunction[] = ["sum", "avg", "count", "min", "max", "custom"];

/**
 * The aggregates the playground starts with. They are seeded as values rather than as the dropdowns' defaults, so the
 * code sample, which leaves out a value equal to its default, still writes them.
 */
const INITIAL_VALUES: DemoPartValues = {
    freight: { aggregate: "sum" },
    quantity: { aggregate: "avg" }
};

const GROUP_PRESETS: Readonly<Record<GroupPreset, GroupDescriptor[]>> = {
    country: [{ field: "country", dir: "asc" }],
    countryShipped: [
        { field: "country", dir: "asc" },
        { field: "shipped", dir: "asc" }
    ],
    none: []
};

/**
 * The playground of the Grid Grouping & Aggregates page. It covers the options of `monaGridGroupable` and its `group`
 * model, each column's aggregate, and the footer templates that show aggregates. It shares nothing with the other grid
 * playgrounds.
 */
@Component({
    selector: "app-grid-grouping-demo",
    imports: [
        GridColumnComponent,
        GridComponent,
        GridFooterTemplateDirective,
        GridGroupableDirective,
        GridGroupFooterTemplateDirective,
        GridSortableDirective,
        PartsDemoContainerComponent,
        SegmentedComponent
    ],
    templateUrl: "./grid-grouping-demo.component.html"
})
export class GridGroupingDemoComponent {
    readonly #columnFeatures: Readonly<Record<ColumnId, FeatureConfigHandler>> = {
        country: this.#features({}),
        customer: this.#features({}),
        freight: this.#features(footerFeatures("freight")),
        quantity: this.#features(footerFeatures("quantity")),
        shipped: this.#features({})
    };
    readonly #groupingFeatures = this.#features({
        groupable: {
            name: "Grouping options",
            description:
                "Binds an options object to monaGridGroupable. Off leaves the bare attribute and its defaults.",
            active: true,
            directiveBinding: { hostAttribute: "monaGridGroupable", buildValue: features => readGroupable(features) },
            subFeatures: {
                enabled: {
                    name: "Enabled",
                    description: "Group at all. Off hides the group panel and ignores the group model.",
                    active: true
                },
                showFooter: {
                    name: "Show footer",
                    description: "Keeps a group's aggregate footer under it while the group is collapsed.",
                    active: false
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
    protected readonly columnFeatures = computed(() => ({
        freight: this.#columnFeatures.freight.data(),
        quantity: this.#columnFeatures.quantity.data()
    }));
    protected readonly columns = computed(() => {
        const values = this.values();
        const read = (id: ColumnId) => readPartValues<GridColumnComponent>(this.#part(id), values);
        return {
            country: read("country"),
            customer: read("customer"),
            freight: read("freight"),
            quantity: read("quantity"),
            shipped: read("shipped")
        };
    });
    protected readonly data = groupingOrders();
    protected readonly eventLog = new DemoEventLog();
    protected readonly grid = computed(() => readPartValues<GridComponent<unknown>>(this.#part("grid"), this.values()));
    protected readonly group = signal<GroupDescriptor[]>(GROUP_PRESETS.country);
    protected readonly groupPreset = signal<GroupPreset>("country");
    protected readonly groupPresetOptions: readonly SegmentedOption<GroupPreset>[] = [
        { label: "None", value: "none" },
        { label: "Country", value: "country" },
        { label: "Country, then shipped", value: "countryShipped" }
    ];
    protected readonly groupableOptions = computed(() => readGroupable(this.#groupingFeatures.data()));
    protected readonly parts = computed<readonly DemoPart[]>(() => {
        const metadata = this.#metadata();
        const gridMetadata = metadata["GridComponent"] ?? emptyMetadata();
        const groupableMetadata = metadata["GridGroupableDirective"] ?? emptyMetadata();
        const columnMetadata = metadata["GridColumnComponent"] ?? emptyMetadata();
        return [
            {
                id: "grid",
                title: "Grid",
                metadata: gridMetadata,
                codeAttributes: ['[data]="orders"', "monaGridSortable", 'class="h-112"'],
                config: {
                    inputs: deriveInputConfig<GridComponent<unknown>>(gridMetadata, gridOverrides(), {
                        resolveAliases: true
                    })
                }
            },
            {
                id: "grouping",
                title: "Grouping",
                metadata: groupableMetadata,
                placement: "host",
                codeAttributes: ['[(group)]="group"'],
                config: {
                    inputs: deriveInputConfig<GridGroupableDirective>(
                        groupableMetadata,
                        { group: undefined, options: undefined },
                        { resolveAliases: true }
                    ),
                    featureHandler: this.#groupingFeatures
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
        computation: (parts, previous) => reconcilePartValues(parts, previous?.value ?? INITIAL_VALUES)
    });

    protected onGroupChange(group: GroupDescriptor[]): void {
        this.group.set(group);
        this.eventLog.record("groupChange", group);
    }

    protected onGroupPresetChange(preset: GroupPreset | null): void {
        if (preset) {
            this.groupPreset.set(preset);
            this.group.set(GROUP_PRESETS[preset]);
        }
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

function readGroupable(features: ComponentConfigFeatureItem): Partial<GroupableOptions> | "" {
    const groupable = features["groupable"];
    if (!groupable?.active) {
        return "";
    }
    return {
        enabled: groupable.subFeatures?.["enabled"]?.active ?? true,
        showFooter: groupable.subFeatures?.["showFooter"]?.active ?? false
    };
}

function footerFeatures(field: "freight" | "quantity"): ComponentConfigFeatureItem {
    return {
        footerTemplate: {
            name: "Footer template",
            description: `Replaces the ${field} aggregate in the grid footer. A "custom" aggregate shows only through it.`,
            active: false,
            code: `
                <ng-template monaGridFooterTemplate let-value let-column="column" let-rows="rows">
                    <span class="font-semibold">{{ column.aggregate }}: {{ value ?? rows.length + " rows" }}</span>
                </ng-template>`
        },
        groupFooterTemplate: {
            name: "Group footer template",
            description: `Replaces the ${field} aggregate under each group. Group the rows to see it.`,
            active: false,
            code: `
                <ng-template monaGridGroupFooterTemplate let-value let-count="count" let-groupValue="groupValue">
                    <span>{{ groupValue }}: {{ value }} in {{ count }} orders</span>
                </ng-template>`
        }
    };
}

function gridOverrides(): Partial<ComponentConfigInputType<GridComponent<unknown>>> {
    return {
        ariaLabel: { alias: "aria-label", type: "string", value: "Orders" },
        ariaLabelledBy: undefined,
        data: undefined,
        expandedKeys: undefined,
        pageSize: { type: "number", value: 20, min: 1, nullable: false },
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

/** The column's aggregate and title. The other column inputs belong to the Overview, Columns and other pages. */
function columnOverrides(id: ColumnId): Partial<ComponentConfigInputType<GridColumnComponent>> {
    const aggregate =
        id === "freight" || id === "quantity"
            ? {
                  type: "dropdown" as const,
                  value: NUMERIC_AGGREGATES,
                  defaultValue: null,
                  clearable: true,
                  placeholder: "None",
                  note: '"custom" computes nothing: it shows only through a footer template.'
              }
            : id === "customer"
              ? {
                    type: "dropdown" as const,
                    value: ["count", "custom"] satisfies AggregateFunction[],
                    defaultValue: null,
                    clearable: true,
                    placeholder: "None",
                    note: "count counts the values that aren't empty."
                }
              : undefined;
    return {
        aggregate,
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
