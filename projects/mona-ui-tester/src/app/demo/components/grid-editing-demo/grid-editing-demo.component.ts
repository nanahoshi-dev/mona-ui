import { Component, computed, inject, Injector, linkedSignal, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormField, validate } from "@angular/forms/signals";
import type { SchemaPathTree } from "@angular/forms/signals";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    GridAddCommandDirective,
    GridCancelCommandDirective,
    GridCellTemplateDirective,
    GridColumnComponent,
    GridCommandColumnComponent,
    GridComponent,
    GridEditableDirective,
    GridEditCommandDirective,
    GridEditTemplateDirective,
    GridRemoveCommandDirective,
    GridSaveCommandDirective,
    GridToolbarTemplateDirective
} from "@nanahoshi/mona-ui/grid";
import type {
    CellEditEvent,
    EditableOptions,
    GridAddEvent,
    GridCancelEvent,
    GridEditEvent,
    GridEditSchemaFactory,
    GridRemoveEvent,
    GridRowCommand,
    GridSaveEvent,
    RowEditEvent
} from "@nanahoshi/mona-ui/grid";
import { SegmentedComponent } from "@nanahoshi/mona-ui/segmented";
import type { SegmentedOption } from "@nanahoshi/mona-ui/segmented";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";
import { filter, map } from "rxjs";
import type { ComponentMetadata } from "../../models/ComponentMetadata";
import { DemoService } from "../../services/demo.service";
import type { ComponentConfigFeatureItem, ComponentConfigInputType } from "../../utils/componentConfig";
import { DemoEventLog, readPartValues, reconcilePartValues } from "../../utils/demoParts";
import type { DemoPart, DemoPartValues } from "../../utils/demoParts";
import { deriveInputConfig, OPTIONAL_BOOLEAN_CHOICES } from "../../utils/deriveInputConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { PartsDemoContainerComponent } from "../parts-demo-container/parts-demo-container.component";
import { type EditingDataSet, type EditingOrder, editingOrders } from "./grid-editing-demo.data";

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

const COMMAND_NAMES: Readonly<Record<GridRowCommand, string>> = {
    cancel: "Cancel",
    edit: "Edit",
    remove: "Remove",
    save: "Save"
};

/** Requires a customer and a freight that isn't negative. */
const orderSchema: GridEditSchemaFactory<EditingOrder> = () => (order: SchemaPathTree<EditingOrder>) => {
    validate(order.customer, ({ value }) =>
        String(value() ?? "").trim() !== "" ? undefined : { kind: "required", message: "Enter a customer." }
    );
    validate(order.freight, ({ value }) => {
        const freight = value();
        return typeof freight === "number" && freight >= 0
            ? undefined
            : { kind: "min", message: "Freight can't be negative." };
    });
};

/**
 * The playground of the Grid Editing page. It covers the options, inputs and events of `monaGridEditable`, the
 * command column and its command buttons, the add command and custom edit templates. It shares nothing with the other
 * grid playgrounds.
 */
@Component({
    selector: "app-grid-editing-demo",
    imports: [
        ButtonDirective,
        FormField,
        GridAddCommandDirective,
        GridCancelCommandDirective,
        GridCellTemplateDirective,
        GridColumnComponent,
        GridCommandColumnComponent,
        GridComponent,
        GridEditableDirective,
        GridEditCommandDirective,
        GridEditTemplateDirective,
        GridRemoveCommandDirective,
        GridSaveCommandDirective,
        GridToolbarTemplateDirective,
        PartsDemoContainerComponent,
        SegmentedComponent,
        TextBoxComponent
    ],
    templateUrl: "./grid-editing-demo.component.html"
})
export class GridEditingDemoComponent {
    readonly #columnFeatures: Readonly<Record<ColumnId, FeatureConfigHandler>> = {
        customer: this.#features({
            editTemplate: {
                name: "Custom edit template",
                description:
                    "Replaces the built-in editor of the column with your own, bound to the cell's form field.",
                active: false,
                code: `
                    <ng-template monaGridEditTemplate let-context>
                        <mona-text-box
                            aria-label="Customer"
                            size="small"
                            [formField]="$any(context.field)"
                            (keydown.escape)="context.cancel()"></mona-text-box>
                    </ng-template>`
            }
        }),
        freight: this.#features({}),
        orderId: this.#features({}),
        shipped: this.#features({})
    };
    readonly #commandFeatures = this.#features({
        customCommands: {
            name: "Custom command buttons",
            description:
                "Replaces the built-in buttons with your own. The command directives take the template's row; Edit only works in row mode.",
            active: false,
            code: `
                <ng-template monaGridCellTemplate let-order let-row="row" let-isEditing="isEditing">
                    @if (isEditing) {
                        <button monaButton look="ghost" size="small" monaGridSaveCommand>Save</button>
                        <button monaButton look="ghost" size="small" monaGridCancelCommand>Cancel</button>
                    } @else {
                        <button monaButton look="ghost" size="small" [monaGridEditCommand]="row">Edit</button>
                        <button monaButton look="ghost" size="small" [monaGridRemoveCommand]="row">Remove</button>
                    }
                </ng-template>`
        }
    });
    readonly #editingFeatures = this.#features({
        editable: {
            name: "Editing options",
            description:
                "Binds an options object to monaGridEditable. Off here leaves the bare attribute, which edits one cell at a time.",
            active: true,
            directiveBinding: {
                hostAttribute: "monaGridEditable",
                buildValue: features => readEditable(features, false)
            },
            subFeatures: {
                enabled: { name: "Enabled", description: "Turns editing on or off.", active: true },
                mode: {
                    name: "Mode",
                    description: "Commit each cell on its own, or a whole row with Save.",
                    type: "dropdown",
                    dropdownDataSource: ["cell", "row"],
                    dropdownValue: "row"
                },
                validation: {
                    name: "Validation",
                    description:
                        "A schema that requires a customer and a freight of zero or more. It is a function, so the code sample leaves it out.",
                    active: true
                },
                commandAriaLabels: {
                    name: "Command aria labels",
                    description:
                        "Names the command buttons after the order (Edit order 10248) instead of the row. It is a function, so the code sample leaves it out.",
                    active: true
                }
            }
        }
    });
    readonly #gridFeatures = this.#features({
        toolbar: {
            name: "Toolbar with Add button",
            description: "A toolbar whose button opens the add row through monaGridAddCommand.",
            active: true,
            code: `
                <ng-template monaGridToolbarTemplate>
                    <button monaButton monaGridAddCommand>Add order</button>
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
    protected readonly columnFeatures = computed(() => ({ customer: this.#columnFeatures.customer.data() }));
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
    protected readonly commandColumn = computed(() =>
        readPartValues<GridCommandColumnComponent>(this.#part("commands"), this.values())
    );
    protected readonly commandFeatures = this.#commandFeatures.data;
    protected readonly dataSet = signal<EditingDataSet>("orders");
    protected readonly dataSetOptions: readonly SegmentedOption<EditingDataSet>[] = [
        { label: "12 orders", value: "orders" },
        { label: "Empty", value: "empty" }
    ];
    protected readonly editMode = computed(() => {
        const options = this.editableOptions();
        return options === "" ? "cell" : options.mode;
    });
    protected readonly editableOptions = computed(() => readEditable(this.#editingFeatures.data(), true));
    protected readonly eventLog = new DemoEventLog();
    protected readonly grid = computed(() => readPartValues<GridComponent<unknown>>(this.#part("grid"), this.values()));
    protected readonly gridFeatures = this.#gridFeatures.data;
    /** The rows, which the save and remove handlers change, and which start over when the data set changes. */
    protected readonly orders = linkedSignal(() => editingOrders(this.dataSet()));
    protected readonly parts = computed<readonly DemoPart[]>(() => {
        const metadata = this.#metadata();
        const gridMetadata = metadata["GridComponent"] ?? emptyMetadata();
        const editableMetadata = metadata["GridEditableDirective"] ?? emptyMetadata();
        const commandMetadata = metadata["GridCommandColumnComponent"] ?? emptyMetadata();
        const columnMetadata = metadata["GridColumnComponent"] ?? emptyMetadata();
        return [
            {
                id: "grid",
                title: "Grid",
                metadata: gridMetadata,
                codeAttributes: ['[data]="orders()"', 'rowKey="orderId"', 'class="h-112"'],
                config: {
                    inputs: deriveInputConfig<GridComponent<unknown>>(gridMetadata, gridOverrides(), {
                        resolveAliases: true
                    }),
                    featureHandler: this.#gridFeatures
                }
            },
            {
                id: "editing",
                title: "Editing",
                metadata: editableMetadata,
                placement: "host",
                codeAttributes: [
                    '[newRowFactory]="newOrder"',
                    '(save)="onSave($event)"',
                    '(remove)="onRemove($event)"'
                ],
                config: {
                    inputs: deriveInputConfig<GridEditableDirective>(editableMetadata, editableOverrides(), {
                        resolveAliases: true
                    }),
                    featureHandler: this.#editingFeatures
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
            })),
            {
                id: "commands",
                title: "Command column",
                metadata: commandMetadata,
                config: {
                    inputs: deriveInputConfig<GridCommandColumnComponent>(commandMetadata, commandOverrides(), {
                        resolveAliases: true
                    }),
                    featureHandler: this.#commandFeatures
                }
            }
        ];
    });
    /** The panels come from metadata that loads after the page; until then the grid would get no settings. */
    protected readonly ready = computed(() => this.parts().every(part => (part.metadata.inputs ?? []).length > 0));
    protected readonly values = linkedSignal<readonly DemoPart[], DemoPartValues>({
        source: this.parts,
        computation: (parts, previous) => reconcilePartValues(parts, previous?.value)
    });

    /** Starts the add row with the next free order number. */
    protected readonly newOrder = (): EditingOrder => ({
        customer: "",
        freight: 0,
        orderId: this.orders().reduce((max, order) => Math.max(max, order.orderId), 10247) + 1,
        shipped: false
    });

    protected onAdd(event: GridAddEvent): void {
        this.eventLog.record("add", { rowData: event.rowData });
    }

    protected onCancel(event: GridCancelEvent): void {
        this.eventLog.record("cancel", { operation: event.operation, reason: event.reason, rowData: event.rowData });
    }

    protected onCellEdit(event: CellEditEvent): void {
        this.eventLog.record("cellEdit", { field: event.field, newValue: event.newValue, oldValue: event.oldValue });
    }

    protected onDataSetChange(set: EditingDataSet | null): void {
        if (set) {
            this.dataSet.set(set);
        }
    }

    protected onEdit(event: GridEditEvent): void {
        this.eventLog.record("edit", { rowData: event.rowData });
    }

    protected onRemove(event: GridRemoveEvent): void {
        this.eventLog.record("remove", { index: event.index, key: event.key });
        this.orders.update(orders => orders.filter(order => order.orderId !== event.key));
    }

    protected onRowEdit(event: RowEditEvent): void {
        this.eventLog.record("rowEdit", { originalRowData: event.originalRowData, rowData: event.rowData });
    }

    protected onSave(event: GridSaveEvent<EditingOrder>): void {
        this.eventLog.record("save", {
            operation: event.operation,
            originalRowData: event.originalRowData,
            rowData: event.rowData
        });
        if (event.operation === "create") {
            this.orders.update(orders => [event.rowData, ...orders]);
            return;
        }
        // Matched by key: the edited row is a new object, not the one the edit started from.
        const orderId = event.originalRowData?.orderId ?? event.rowData.orderId;
        this.orders.update(orders => orders.map(order => (order.orderId === orderId ? event.rowData : order)));
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

/** The options for the directive. Without `withFunctions`, for the code sample, which can't write a function. */
function readEditable(
    features: ComponentConfigFeatureItem,
    withFunctions: boolean
): EditableOptions<EditingOrder> | "" {
    const item = features["editable"];
    if (!item?.active) {
        return "";
    }
    const read = (name: string) => item.subFeatures?.[name];
    const options: EditableOptions<EditingOrder> = {
        enabled: read("enabled")?.active ?? true,
        mode: (read("mode")?.dropdownValue as EditableOptions["mode"]) ?? "row"
    };
    if (!withFunctions) {
        return options;
    }
    return {
        ...options,
        ...(read("validation")?.active ? { schema: orderSchema } : {}),
        ...(read("commandAriaLabels")?.active
            ? {
                  commandAriaLabel: (command: GridRowCommand, rowData: Record<PropertyKey, unknown>) =>
                      `${COMMAND_NAMES[command]} order ${String(rowData["orderId"])}`
              }
            : {})
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

/** The options go through the Editing options feature, and the new row factory is the page's own. */
function editableOverrides(): Partial<ComponentConfigInputType<GridEditableDirective>> {
    return {
        newRowFactory: undefined,
        options: undefined
    };
}

function commandOverrides(): Partial<ComponentConfigInputType<GridCommandColumnComponent>> {
    return {
        stateKey: undefined,
        title: { type: "string", value: "" },
        width: { type: "number", nullable: true, value: 160, min: 40 }
    };
}

/** The title and whether the column is editable. The other column inputs have pages of their own. */
function columnOverrides(id: ColumnId): Partial<ComponentConfigInputType<GridColumnComponent>> {
    return {
        aggregate: undefined,
        editable: {
            type: "customDropdown",
            value: OPTIONAL_BOOLEAN_CHOICES,
            textField: "text",
            valueField: "value",
            defaultValue: undefined,
            note:
                id === "orderId"
                    ? "Automatic leaves the rowKey column read-only. Turn it on to type the number of a new order."
                    : "Automatic makes every column editable except the rowKey one."
        },
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
