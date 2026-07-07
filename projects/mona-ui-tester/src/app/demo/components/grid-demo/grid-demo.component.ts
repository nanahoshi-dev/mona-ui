import { JsonPipe, NgComponentOutlet } from "@angular/common";
import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    inject,
    input,
    linkedSignal,
    signal
} from "@angular/core";
import { FormField, validate, type SchemaPathTree } from "@angular/forms/signals";
import { LucideContainer, LucideOctagonAlert, LucidePenLine } from "@lucide/angular";
import { DateTime } from "luxon";
import {
    CellEditEvent,
    GridAddCommandDirective,
    RowEditEvent,
    GridCellTemplateDirective,
    GridCommandColumnComponent,
    GridColumnComponent,
    GridComponent,
    GridDetailTemplateDirective,
    GridEditableDirective,
    GridEditTemplateDirective,
    GridGroupableDirective,
    GridSelectableDirective,
    GridSelectableOptions,
    GridVirtualScrollDirective,
    GridFooterTemplateDirective,
    GridGroupFooterTemplateDirective,
    GridRemoveEvent,
    GridSaveEvent,
    GridToolbarTemplateDirective,
    GridExportDirective,
    GridFilterableDirective,
    type AggregateFunction,
    type GridColumnLockedPosition,
    type GridGroupableOptions,
    type GridFilterableOptions,
    GridNoDataTemplateDirective,
    GridStatePersistenceDirective,
    type GridState,
    GridHeaderTemplateDirective,
    GridSortableDirective,
    GridReorderableDirective,
    type ReorderableOptions,
    ColumnReorderEvent,
    type ResizableOptions,
    GridResizableDirective,
    type ColumnResizeEvent,
    type EditableOptions,
    type GridEditFormContext,
    type GridEditSchemaFactory,
    type GridEditTemplateContext
} from "mona-ui/grid";
import { VirtualScrollOptions } from "mona-ui";
import { DataType, type CompositeFilterDescriptor } from "mona-ui/filter";
import { ButtonDirective } from "mona-ui/button";
import { ChipComponent } from "mona-ui/chip";
import { TooltipDirective, TooltipComponent } from "mona-ui/tooltip";
import { TextBoxComponent, TextBoxSuffixTemplateDirective } from "mona-ui/text-box";
import { CodeViewerComponent } from "../code-viewer/code-viewer.component";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

interface GridDemoEditRow extends Record<PropertyKey, unknown> {
    Freight: number;
    ShipName: string;
}

@Component({
    selector: "app-grid-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./grid-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GridDemoComponent extends AbstractDemoComponent<GridComponent<unknown>> {
    readonly #injector = createFeatureInjector({
        aggregation: {
            code: ``,
            name: "Aggregation",
            description: "Customize the aggregation function for grid columns",
            active: false,
            subFeatures: {
                column: {
                    code: ``,
                    name: "Column",
                    description: "Select a grid column for aggregation",
                    active: false,
                    type: "dropdown",
                    dropdownDataSource: ["Freight"],
                    clearable: true
                },
                aggregate: {
                    code: ``,
                    name: "Aggregate",
                    description: "Customize the aggregation function for a grid column",
                    active: false,
                    type: "dropdown",
                    dropdownDataSource: ["sum", "avg", "count", "min", "max"],
                    dropdownDefaultValue: "sum",
                    dropdownValue: "sum"
                },
                template: {
                    code: ``,
                    name: "Template",
                    description: "Customize the template of the footer cell",
                    active: true
                }
            }
        },
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
        editing: {
            code: ``,
            name: "Editing",
            description: "Configure signal-form-backed grid editing",
            active: true,
            subFeatures: {
                mode: {
                    code: ``,
                    name: "Mode",
                    description: "Choose whether editing starts per cell or per row",
                    active: true,
                    type: "dropdown",
                    dropdownDataSource: ["cell", "row"],
                    dropdownDefaultValue: "row",
                    dropdownValue: "row"
                },
                validation: {
                    code: ``,
                    name: "Validation",
                    description: "Require a ship name and non-negative freight through the grid edit schema",
                    active: true
                },
                customTemplate: {
                    code: ``,
                    name: "Custom Edit Template",
                    description: "Render the Ship Name editor from the edit-template signal form context",
                    active: true
                }
            }
        },
        export: {
            code: ``,
            name: "Export",
            description: "Export the grid data",
            active: false
        },
        filtering: {
            code: ``,
            name: "Filtering",
            description: "Enable filtering for grid rows",
            active: false,
            subFeatures: {
                type: {
                    code: ``,
                    active: false,
                    description: "Filtering type for grid rows",
                    name: "Type",
                    type: "dropdown",
                    dropdownDataSource: ["menu", "row", "menu, row"] as const,
                    dropdownValue: "menu"
                }
            }
        },
        grouping: {
            code: ``,
            name: "Grouping",
            description: "Enable grouping for grid rows",
            active: false,
            subFeatures: {
                showFooter: {
                    code: ``,
                    active: false,
                    description: "Display aggregation footer when group is collapsed",
                    name: "Show Footer"
                }
            }
        },
        headerTemplate: {
            code: ``,
            name: "Header Template",
            description: "Customize the look of header cells",
            active: false
        },
        lockedColumns: {
            code: ``,
            name: "Locked Columns",
            description: "Configure locked columns",
            active: false,
            subFeatures: {
                column: {
                    code: ``,
                    active: false,
                    description: "Select locked column",
                    name: "Locked Column",
                    type: "dropdown",
                    dropdownDataSource: ["Ship Name", "Ship City"],
                    dropdownValue: null,
                    clearable: true
                },
                lockedPosition: {
                    code: ``,
                    active: false,
                    description: "Locked position for selected column",
                    name: "Locked Position",
                    type: "dropdown",
                    dropdownDataSource: ["left", "right"] as const,
                    dropdownValue: "left"
                }
            }
        },
        masterDetail: {
            code: ``,
            name: "Master Detail",
            description: "Enable master detail",
            active: false
        },
        noDataTemplate: {
            code: ``,
            name: "No Data Template",
            description: "Customize the template for when there is no data to display",
            active: false
        },
        reordering: {
            code: ``,
            name: "Reordering",
            description: "Enable column reordering for the grid",
            active: false
        },
        resizing: {
            code: ``,
            name: "Column Resizing",
            description: "Enable column resizing for the grid",
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
        sorting: {
            name: "Sorting",
            description: "Enable sorting for the grid",
            active: false,
            subFeatures: {
                allowUnsort: {
                    code: ``,
                    active: false,
                    description: "Allow unsorting of columns",
                    name: "Allow Unsort"
                },
                mode: {
                    code: ``,
                    active: false,
                    description: "Sort mode",
                    name: "Mode",
                    type: "dropdown",
                    dropdownDataSource: ["single", "multiple"] as const,
                    dropdownValue: "single"
                },
                showIndices: {
                    code: ``,
                    active: false,
                    description: "Show indices for sorted columns",
                    name: "Show Indices"
                }
            }
        },
        statePersistence: {
            code: ``,
            name: "State Persistence",
            description: "Persist the grid state across sessions",
            active: false,
            subFeatures: {
                persistPageSize: {
                    code: ``,
                    active: false,
                    description: "Persist the page size across sessions",
                    name: "Persist Page Size"
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
            pageSize: {
                type: "number",
                value: 10
            },
            pageSizeValues: {
                type: "iterable",
                value: [10, 20, 30, 40, 50]
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
        GridAddCommandDirective,
        GridCommandColumnComponent,
        GridColumnComponent,
        GridSelectableDirective,
        GridGroupableDirective,
        GridVirtualScrollDirective,
        GridDetailTemplateDirective,
        JsonPipe,
        GridEditableDirective,
        GridCellTemplateDirective,
        GridEditTemplateDirective,
        GridFooterTemplateDirective,
        GridGroupFooterTemplateDirective,
        GridExportDirective,
        ButtonDirective,
        GridFilterableDirective,
        ChipComponent,
        GridNoDataTemplateDirective,
        CodeViewerComponent,
        GridStatePersistenceDirective,
        GridToolbarTemplateDirective,
        GridHeaderTemplateDirective,
        LucideContainer,
        GridSortableDirective,
        GridReorderableDirective,
        GridResizableDirective,
        FormField,
        TextBoxComponent,
        TextBoxSuffixTemplateDirective,
        LucideOctagonAlert,
        TooltipComponent
    ],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
        @let effectiveGridData = virtualization().enabled ? virtualGridData() : gridData();
        @let featureData = this.features();

        @if (exportable()) {
            <button monaButton (click)="gridExport.exportCsv()">Export as CSV</button>
        }

        <mona-grid
            [data]="effectiveGridData"
            [pageSize]="pageSize()"
            [pageSizeValues]="pageSizeValues()"
            [resizeMethod]="resizeMethod()"
            [responsivePager]="responsivePager()"
            [rounded]="rounded()"
            [newRowFactory]="createGridRow"
            (cellEdit)="onCellEdit($event)"
            (rowEdit)="onRowEdit($event)"
            (save)="onSave($event)"
            (remove)="onRemove($event)"
            [monaGridEditable]="editableOptions()"
            (edit)="onGridEditStart($event)"
            [monaGridFilterable]="filterable()"
            [filter]="filter()"
            (filterChange)="onFilterChange($event)"
            [monaGridVirtualScroll]="virtualization()"
            [scrollEndThreshold]="infiniteScroll()?.scrollEndThreshold || 5"
            (scrollEnd)="onScrollEnd()"
            [monaGridGroupable]="groupable()"
            [monaGridReorderable]="reordering()"
            (columnReorder)="onColumnReorder($event)"
            [monaGridResizable]="resizing()"
            (columnResize)="onColumnResize($event)"
            [monaGridSelectable]="selection()"
            rowKey="OrderID"
            [monaGridSortable]="sorting()"
            monaGridExport
            #gridExport="monaGridExport"
            [monaGridStatePersistence]="statePersistence()"
            [state]="state()"
            (stateChange)="onStateChange($event)"
            class="w-full h-112">
            <ng-template monaGridToolbarTemplate let-addRowVisible="addRowVisible">
                <button monaButton monaGridAddCommand [disabled]="addRowVisible">Add</button>
            </ng-template>
            @for (column of columns; track column.field) {
                @let width = null;
                <mona-grid-column
                    [field]="column.field"
                    [title]="column.title"
                    [type]="column.filterType"
                    [aggregate]="aggregationColumn() === column.title ? aggregationFunction() : null"
                    [locked]="lockedColumn() === column.title"
                    [lockedPosition]="lockedPosition() || 'left'"
                    [format]="column.format"
                    [width]="width">
                    @if (featureData["cellTemplate"].active) {
                        <ng-template monaGridCellTemplate let-dataItem>
                            <span class="truncate" #cellElement>
                                @if (column.field === "Freight") {
                                    @let type =
                                        dataItem[column.field] < 25
                                            ? "success"
                                            : dataItem[column.field] > 89
                                              ? "error"
                                              : "info";
                                    <mona-chip [rounded]="'small'" [look]="type">
                                        {{ dataItem[column.field] }} tonnes
                                    </mona-chip>
                                } @else {
                                    {{ dataItem[column.field] }}
                                }
                            </span>
                        </ng-template>
                    }
                    @if (column.field === "Freight") {
                        @if (featureData["headerTemplate"].active) {
                            <ng-template monaGridHeaderTemplate let-column>
                                <div class="w-full h-full gap-2 flex items-center px-2 overflow-hidden">
                                    <svg lucideContainer [size]="12"></svg>
                                    <span class="font-semibold">{{ column.title }}</span>
                                </div>
                            </ng-template>
                        }
                    }
                    <!--                    @if (column.field === "Delivered") {-->
                    <!--                        <ng-template monaGridEditTemplate let-dataItem>-->
                    <!--                            <div class="w-full h-full flex items-center px-2">-->
                    <!--                                <mona-switch-->
                    <!--                                    [ngModel]="dataItem[column.field]"-->
                    <!--                                    (ngModelChange)="updateCellValue(dataItem, column.field, $event)"></mona-switch>-->
                    <!--                            </div>-->
                    <!--                        </ng-template>-->
                    <!--                    }-->
                    @if (column.field === "Freight") {
                        @if (aggregationTemplate()) {
                            <ng-template monaGridFooterTemplate let-value let-aggregates="aggregate">
                                <span class="text-info">{{ value }}</span>
                            </ng-template>
                        }
                        <ng-template monaGridGroupFooterTemplate let-count="count" let-groupValue="groupValue">
                            <span class="block truncate font-medium"> {{ count }} rows in {{ groupValue }} </span>
                        </ng-template>
                    }
                    @if (column.field === "ShipName" && editingCustomTemplate()) {
                        <ng-template monaGridEditTemplate let-context>
                            <div class="w-full h-full flex flex-col justify-center">
                                <mona-text-box
                                    [formField]="$any(context.field)"
                                    [rounded]="'none'"
                                    [size]="'small'"
                                    (keydown.enter)="onCustomTextBoxEdit(context)"
                                    (keydown.escape)="context.cancel()"
                                    [inputAttributes]="{ autocomplete: 'off' }">
                                    @if (context.invalid && context.touched) {
                                        <ng-template monaTextBoxSuffixTemplate>
                                            <span class="px-1" #alertIcon
                                                ><svg lucideAlertOctagon [size]="12"></svg
                                            ></span>
                                            <mona-tooltip [target]="alertIcon">
                                                <span class="p-1">{{
                                                    context.errors[0]?.message || "Ship name is required"
                                                }}</span>
                                            </mona-tooltip>
                                        </ng-template>
                                    }
                                </mona-text-box>
                            </div>
                        </ng-template>
                    }
                </mona-grid-column>
            }
            <mona-grid-command-column
                [width]="100"
                [locked]="true"
                [lockedPosition]="'right'"
                [title]="'Commands'"
                [removeConfirmation]="true">
                <!--                <ng-template monaGridCellTemplate let-edit="edit">-->
                <!--                    <button monaButton [iconOnly]="true" size="small" look="clear" (click)="edit()">-->
                <!--                        <svg lucideEdit3 [size]="14"></svg>-->
                <!--                    </button>-->
                <!--                </ng-template>-->
            </mona-grid-command-column>
            @if (masterDetail()) {
                <ng-template monaGridDetailTemplate let-dataItem>
                    <!--                    <pre class="h-full w-full p-2">{{ dataItem | json }}</pre>-->
                    <app-code-viewer [code]="dataItem | json" [language]="'json'"></app-code-viewer>
                </ng-template>
            }
            @if (noDataTemplate()) {
                <ng-template monaGridNoDataTemplate>
                    <p class="uppercase text-pink-800">No records...</p>
                </ng-template>
            }
        </mona-grid>
    `
})
class GridWrapperComponent implements ComponentInputsAsSignal<GridComponent<unknown>> {
    readonly #stateStorageKey = "grid-demo-state";
    protected readonly aggregation = computed(() => {
        const features = this.features();
        return features["aggregation"].subFeatures || {};
    });
    protected readonly aggregationColumn = computed(() => {
        const aggregation = this.aggregation();
        return aggregation["column"].dropdownValue || "";
    });
    protected readonly aggregationFunction = computed(() => {
        const aggregation = this.aggregation();
        return aggregation["aggregate"].dropdownValue || "";
    });
    protected readonly aggregationTemplate = computed(() => {
        const aggregation = this.aggregation();
        return aggregation["template"].active || "";
    });
    protected readonly columns: Array<{
        field: string;
        title: string;
        filterType: DataType;
        format?: string;
        aggregate?: AggregateFunction | null;
        locked?: boolean;
        lockedPosition?: GridColumnLockedPosition;
    }> = [
        {
            field: "OrderID",
            title: "Order ID",
            filterType: "number",
            aggregate: "count",
            locked: false,
            lockedPosition: "left"
        },
        { field: "ShipName", title: "Ship Name", filterType: "string", aggregate: "custom" },
        { field: "Freight", title: "Freight", filterType: "number", aggregate: "avg" },
        { field: "ShipCity", title: "Ship City", filterType: "string" },
        { field: "ShipCountry", title: "Ship Country", filterType: "string" },
        { field: "Delivered", title: "Delivered", filterType: "boolean", lockedPosition: "right" },
        { field: "OrderDate", title: "Order Date", filterType: "date", format: "dd/MM/yyyy" },
        { field: "ShippedDate", title: "Shipped Date", filterType: "date" }
    ];
    protected readonly exportable = computed(() => {
        const features = this.features();
        const exportFeature = features["export"];
        return exportFeature ? exportFeature.active : false;
    });
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly editableOptions = computed<EditableOptions>(() => {
        const features = this.features();
        const editingFeature = features["editing"];
        const editingSubFeatures = editingFeature.subFeatures || {};
        const mode = editingSubFeatures["mode"].dropdownValue === "cell" ? "cell" : "row";
        return {
            enabled: editingFeature.active ?? true,
            mode,
            schema: editingSubFeatures["validation"].active
                ? (this.createEditSchema as GridEditSchemaFactory)
                : undefined
        };
    });
    protected readonly editingCustomTemplate = computed(() => {
        const features = this.features();
        const editingFeature = features["editing"];
        const editingSubFeatures = editingFeature.subFeatures || {};
        return editingSubFeatures["customTemplate"].active ?? false;
    });
    protected readonly filter = signal<CompositeFilterDescriptor[]>([
        {
            logic: "and",
            filters: [
                // {
                //     field: "ShipName",
                //     operator: "contains",
                //     value: "e"
                // }
            ]
        }
    ]);
    protected readonly filterable = computed(() => {
        const features = this.features();
        const filteringFeature = features["filtering"];
        const filteringTypeFeature = filteringFeature.subFeatures || {};
        const options: GridFilterableOptions = {
            enabled: filteringFeature.active ?? false,
            type: filteringTypeFeature["type"]?.dropdownValue || "menu"
        };
        return options;
    });
    protected readonly gridData = signal(generateRandomGridData(1000));
    protected readonly createEditSchema =
        (_context: GridEditFormContext) =>
        (row: SchemaPathTree<GridDemoEditRow>): void => {
            validate(row.ShipName, ({ value }) => {
                const shipName = value();
                return typeof shipName === "string" && shipName.trim() !== ""
                    ? undefined
                    : { kind: "required", message: "Ship name is required." };
            });
            validate(row.Freight, ({ value }) => {
                const freight = value();
                return typeof freight === "number" && freight >= 10
                    ? undefined
                    : { kind: "min", message: "Freight must be ten or greater." };
            });
        };
    protected readonly createGridRow = (): Record<PropertyKey, unknown> => {
        const gridData = this.getActiveGridData();
        const nextOrderId =
            gridData.reduce((max, row) => {
                const orderId = row["OrderID"];
                return typeof orderId === "number" ? Math.max(max, orderId) : max;
            }, 0) + 1;
        const now = new Date();
        return {
            Delivered: false,
            Freight: 0,
            OrderDate: now,
            OrderID: nextOrderId,
            ShipCity: "",
            ShipCountry: "",
            ShipName: "",
            ShippedDate: now
        };
    };
    protected readonly groupable = computed(() => {
        const features = this.features();
        const groupingFeature = features["grouping"];
        const subFeatures = groupingFeature.subFeatures || {};
        const options: GridGroupableOptions = {
            enabled: groupingFeature.active ?? false,
            showFooter: subFeatures["showFooter"]?.active ?? false
        };
        return options;
    });
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
    protected readonly lockedColumn = computed(() => {
        const features = this.features();
        const subFeatures = features["lockedColumns"].subFeatures || {};
        return subFeatures["column"].dropdownValue || null;
    });
    protected readonly lockedPosition = computed(() => {
        const features = this.features();
        const subFeatures = features["lockedColumns"].subFeatures || {};
        return subFeatures["lockedPosition"].dropdownValue || null;
    });
    protected readonly masterDetail = computed(() => {
        const features = this.features();
        return features["masterDetail"].active ?? false;
    });
    protected readonly noDataTemplate = computed(() => {
        const features = this.features();
        return features["noDataTemplate"].active;
    });
    protected readonly reordering = computed(() => {
        const features = this.features();
        const options: ReorderableOptions = {
            enabled: features["reordering"].active ?? false
        };
        return options;
    });
    protected readonly resizing = computed(() => {
        const features = this.features();
        const options: ResizableOptions = {
            enabled: features["resizing"].active ?? false
        };
        return options;
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
    protected readonly sorting = computed(() => {
        const features = this.features();
        const subFeatures = features["sorting"].subFeatures || {};
        return {
            enabled: features["sorting"].active ?? false,
            allowUnsort: subFeatures["allowUnsort"].active ?? false,
            mode: subFeatures["mode"].dropdownValue ?? "single",
            showIndices: subFeatures["showIndices"].active ?? false
        };
    });
    protected readonly state = signal<GridState | null>(null);
    protected readonly statePersistence = computed(() => {
        const features = this.features();
        const subFeatures = features["statePersistence"].subFeatures || {};
        return {
            enabled: features["statePersistence"].active ?? false,
            persistPageSize: subFeatures["persistPageSize"].active ?? false
        };
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
    public readonly pageSize = input<ReturnType<GridComponent<unknown>["pageSize"]>>(10);
    public readonly pageSizeValues = input<ReturnType<GridComponent<unknown>["pageSizeValues"]>>([10, 20, 30, 40, 50]);
    public readonly resizeMethod = input<ReturnType<GridComponent<unknown>["resizeMethod"]>>("fitView");
    public readonly rounded = input<ReturnType<GridComponent<unknown>["rounded"]>>("medium");
    public readonly responsivePager = input<ReturnType<GridComponent<unknown>["responsivePager"]>>(false);

    public constructor() {
        effect(() => {
            console.log("Locked column:", this.lockedColumn());
        });
        afterNextRender({
            read: () => {
                const state = window.localStorage.getItem(this.#stateStorageKey);
                if (state) {
                    this.state.set(JSON.parse(state));
                }
            }
        });
    }

    protected onCellEdit(event: CellEditEvent): void {
        console.log("Cell edited:", event);
        // window.setTimeout(() => {
        //     const gridData = this.getActiveGridData();
        //     const row = gridData.find(row => row === event.rowData);
        //     if (!row) return;
        //     const field = event.field as keyof typeof row;
        //     if (row[field] === event.newValue) {
        //         return;
        //     }
        //     row[field] = event.newValue;
        //     gridData.splice(gridData.indexOf(event.rowData as typeof row), 1, row);
        //     this.setActiveGridData(gridData);
        // }, 1000);
        console.log("Cell edited:");
        event.session.form().reset(event.session.originalRowData ?? undefined);
    }

    protected onColumnReorder(event: ColumnReorderEvent): void {
        console.log("Column reordered:", event);
        if (event.column.field === "OrderID") {
            event.preventDefault();
            console.log("Prevented reordering of OrderID column");
        }
    }

    protected onColumnResize(event: ColumnResizeEvent): void {
        console.log("Column resized:", event);
    }

    protected onCustomTextBoxEdit(context: GridEditTemplateContext): void {
        console.log("Custom text box edited:", context);
        context.setValue(context.value);
        context.commit();
    }

    protected onFilterChange(event: CompositeFilterDescriptor[]): void {
        console.log("Filter changed:", event);
        this.filter.set(event);
    }

    protected onGridEditStart(event: unknown): void {
        console.log("Grid edit started:", event);
    }

    protected onRowEdit(event: RowEditEvent): void {
        console.log("Row edited:", event);
    }

    protected onRemove(event: GridRemoveEvent): void {
        const gridData = this.getActiveGridData();
        this.setActiveGridData(gridData.filter(row => row !== event.rowData));
    }

    protected onSave(event: GridSaveEvent): void {
        const gridData = this.getActiveGridData();
        if (event.operation === "create") {
            this.setActiveGridData([event.rowData, ...gridData]);
            return;
        }
        const originalRowData = event.originalRowData;
        if (originalRowData == null) {
            return;
        }
        this.setActiveGridData(gridData.map(row => (row === originalRowData ? event.rowData : row)));
    }

    protected onScrollEnd(): void {
        if (this.infiniteScroll()) {
            this.virtualGridData.update(data => [
                ...data,
                ...generateRandomGridData(10, this.virtualGridData().length)
            ]);
        }
    }

    protected onStateChange(event: GridState | null): void {
        if (event) {
            window.localStorage.setItem(this.#stateStorageKey, JSON.stringify(event));
        }
    }

    protected updateCellValue(dataItem: Record<PropertyKey, unknown>, field: string, value: unknown): void {
        dataItem[field] = value;
        this.virtualization().enabled
            ? this.virtualGridData.set([...this.virtualGridData()])
            : this.gridData.set([...this.gridData()]);
    }

    private getActiveGridData(): Record<PropertyKey, unknown>[] {
        return this.virtualization().enabled ? this.virtualGridData() : this.gridData();
    }

    private setActiveGridData(data: Record<PropertyKey, unknown>[]): void {
        this.virtualization().enabled ? this.virtualGridData.set([...data]) : this.gridData.set([...data]);
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

        const minOrderLimit = DateTime.now().minus({ months: 3 }).toMillis();
        const maxOrderLimit = DateTime.now().minus({ weeks: 1 }).toMillis();
        const orderDate = DateTime.fromMillis(Math.random() * (maxOrderLimit - minOrderLimit) + minOrderLimit);

        const minShippedLimit = DateTime.now().minus({ days: 3 }).toMillis();
        const shippedDate = DateTime.fromMillis(Math.random() * (minShippedLimit - minOrderLimit) + minOrderLimit);

        generatedData.push({
            OrderID: orderNumber++,
            ShipName: shipNames[randomShipNameIndex],
            Freight: Math.floor(Math.random() * 100),
            ShipCity: cities[randomCityIndex],
            ShipCountry: countries[randomCountryIndex],
            Delivered: Math.random() > 0.5, //Math.floor(Math.random() * 4),
            OrderDate: orderDate.toJSDate(),
            ShippedDate: shippedDate.toJSDate()
        });
    }

    return generatedData;
}
