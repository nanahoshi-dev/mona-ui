import { Component, computed, inject, Injector, linkedSignal, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { GridColumnComponent, GridComponent, GridSelectableDirective } from "@nanahoshi/mona-ui/grid";
import type { GridKeySelector, SelectableOptions } from "@nanahoshi/mona-ui/grid";
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
import { type SelectionDataSet, type SelectionOrder, selectionOrders } from "./grid-selection-demo.data";

type ColumnId = "customer" | "freight" | "orderId";

interface ColumnSpec {
    readonly code: readonly string[];
    readonly id: ColumnId;
    readonly title: string;
}

const COLUMNS: readonly ColumnSpec[] = [
    { id: "orderId", title: "Order ID column", code: ['field="orderId"', 'type="number"'] },
    { id: "customer", title: "Customer column", code: ['field="customer"'] },
    { id: "freight", title: "Freight column", code: ['field="freight"', 'type="number"'] }
];

const COLUMN_TITLES: Readonly<Record<ColumnId, string>> = {
    customer: "Customer",
    freight: "Freight",
    orderId: "Order ID"
};

const SELECT_BY_VALUES: readonly { readonly text: string; readonly value: GridKeySelector<SelectionOrder> }[] = [
    { text: "The grid's rowKey", value: "" },
    { text: "The orderId field", value: "orderId" },
    { text: "A function (row => row.orderId)", value: (row: SelectionOrder) => row.orderId }
];

/**
 * The playground of the Grid Selection page. It covers the options, inputs and output of `monaGridSelectable`, and
 * selecting rows from code. It shares nothing with the other grid playgrounds.
 */
@Component({
    selector: "app-grid-selection-demo",
    imports: [
        ButtonDirective,
        GridColumnComponent,
        GridComponent,
        GridSelectableDirective,
        PartsDemoContainerComponent,
        SegmentedComponent
    ],
    templateUrl: "./grid-selection-demo.component.html"
})
export class GridSelectionDemoComponent {
    readonly #metadata = toSignal(
        inject(DemoService).metadata$.pipe(
            filter(metadata => !!metadata),
            map(metadata => metadata ?? {})
        ),
        { initialValue: {} as Record<string, ComponentMetadata> }
    );
    readonly #selectionFeatures = this.#features({
        selectable: {
            name: "Selection options",
            description:
                "Binds an options object to monaGridSelectable. Off here leaves the bare attribute, which selects one row at a time without checkboxes.",
            active: true,
            directiveBinding: {
                hostAttribute: "monaGridSelectable",
                buildValue: features => readSelectable(features, false)
            },
            subFeatures: {
                enabled: { name: "Enabled", description: "Turns selection on or off.", active: true },
                mode: {
                    name: "Mode",
                    description: "One row at a time, or many.",
                    type: "dropdown",
                    dropdownDataSource: ["single", "multiple"],
                    dropdownValue: "multiple"
                },
                showCheckboxes: {
                    name: "Show checkboxes",
                    description: "Adds a column of selection checkboxes.",
                    active: true
                },
                showSelectAll: {
                    name: "Show select all",
                    description: "A checkbox in that column's header, in multiple mode.",
                    active: true
                },
                selectAllScope: {
                    name: "Select all scope",
                    description: "Whether select all takes the current page or every row of the view.",
                    type: "dropdown",
                    dropdownDataSource: ["page", "view"],
                    dropdownValue: "page"
                },
                selectOnRowClick: {
                    name: "Select on row click",
                    description: "Clicking a row selects it too, not only its checkbox.",
                    active: false
                },
                rowAriaLabel: {
                    name: "Row aria label",
                    description:
                        "Names each checkbox after its order (Select order 10248) instead of its position. It is a function, so the code sample leaves it out.",
                    active: true
                }
            }
        }
    });
    protected readonly columns = computed(() => {
        const values = this.values();
        const read = (id: ColumnId) => readPartValues<GridColumnComponent>(this.#part(id), values);
        return { customer: read("customer"), freight: read("freight"), orderId: read("orderId") };
    });
    protected readonly data = computed(() => selectionOrders(this.dataSet()));
    protected readonly dataSet = signal<SelectionDataSet>("orders");
    protected readonly dataSetOptions: readonly SegmentedOption<SelectionDataSet>[] = [
        { label: "60 orders", value: "orders" },
        { label: "3 orders", value: "few" }
    ];
    protected readonly eventLog = new DemoEventLog();
    protected readonly grid = computed(() => readPartValues<GridComponent<unknown>>(this.#part("grid"), this.values()));
    protected readonly parts = computed<readonly DemoPart[]>(() => {
        const metadata = this.#metadata();
        const gridMetadata = metadata["GridComponent"] ?? emptyMetadata();
        const selectableMetadata = metadata["GridSelectableDirective"] ?? emptyMetadata();
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
                    })
                }
            },
            {
                id: "selection",
                title: "Selection",
                metadata: selectableMetadata,
                placement: "host",
                codeAttributes: ['[selectedKeys]="selectedKeys()"', '(selectedKeysChange)="selectedKeys.set($event)"'],
                config: {
                    inputs: deriveInputConfig<GridSelectableDirective>(selectableMetadata, selectableOverrides(), {
                        resolveAliases: true
                    }),
                    featureHandler: this.#selectionFeatures
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
    /** The panels come from metadata that loads after the page; until then the grid would get no settings. */
    protected readonly ready = computed(() => this.parts().every(part => (part.metadata.inputs ?? []).length > 0));
    protected readonly selectableOptions = computed(() => readSelectable(this.#selectionFeatures.data(), true));
    protected readonly selectedKeys = signal<readonly unknown[]>([10248, 10251]);
    protected readonly selectedText = computed(() => {
        const keys = this.selectedKeys();
        return keys.length === 0 ? "none" : keys.map(key => String(key)).join(", ");
    });
    protected readonly selection = computed(() =>
        readPartValues<GridSelectableDirective>(this.#part("selection"), this.values())
    );
    protected readonly values = linkedSignal<readonly DemoPart[], DemoPartValues>({
        source: this.parts,
        computation: (parts, previous) => reconcilePartValues(parts, previous?.value)
    });

    protected onClearSelection(): void {
        this.selectedKeys.set([]);
    }

    protected onDataSetChange(set: SelectionDataSet | null): void {
        if (set) {
            this.dataSet.set(set);
        }
    }

    protected onSelectFirstFive(): void {
        const selectBy = this.selection().selectBy;
        this.selectedKeys.set(
            this.data()
                .slice(0, 5)
                .map(order => keyOf(order, selectBy))
        );
    }

    protected onSelectedKeysChange(keys: unknown[]): void {
        this.selectedKeys.set(keys);
        this.eventLog.record("selectedKeysChange", keys);
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

/** The key a row is selected by, as the directive reads it, so keys set from code match the rows. */
function keyOf(order: SelectionOrder, selectBy: GridKeySelector<unknown> | undefined): unknown {
    if (typeof selectBy === "function") {
        return selectBy(order);
    }
    if (typeof selectBy === "string" && selectBy !== "") {
        return (order as unknown as Record<string, unknown>)[selectBy];
    }
    return order.orderId;
}

/** The options for the directive. Without `withFunctions`, for the code sample, which can't write a function. */
function readSelectable(features: ComponentConfigFeatureItem, withFunctions: boolean): SelectableOptions | "" {
    const item = features["selectable"];
    if (!item?.active) {
        return "";
    }
    const read = (name: string) => item.subFeatures?.[name];
    const options: SelectableOptions = {
        enabled: read("enabled")?.active ?? true,
        mode: (read("mode")?.dropdownValue as SelectableOptions["mode"]) ?? "multiple",
        selectAllScope: (read("selectAllScope")?.dropdownValue as SelectableOptions["selectAllScope"]) ?? "page",
        selectOnRowClick: read("selectOnRowClick")?.active ?? false,
        showCheckboxes: read("showCheckboxes")?.active ?? true,
        showSelectAll: read("showSelectAll")?.active ?? true
    };
    if (withFunctions && read("rowAriaLabel")?.active) {
        return { ...options, rowAriaLabel: row => `Select order ${String(row["orderId"])}` };
    }
    return options;
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

function selectableOverrides(): Partial<ComponentConfigInputType<GridSelectableDirective>> {
    return {
        options: undefined,
        selectBy: {
            type: "customDropdown",
            value: SELECT_BY_VALUES,
            textField: "text",
            valueField: "value",
            defaultValue: "",
            note: "What a row is selected by. Every choice here gives the order number."
        },
        selectedKeys: undefined
    };
}

/** Only the title. The other column inputs have pages of their own. */
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
