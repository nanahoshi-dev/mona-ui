import { Component, computed, inject, linkedSignal, signal, viewChild } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { GridColumnComponent, GridComponent, GridTreeDirective } from "@nanahoshi/mona-ui/grid";
import type { GridKeySelector, GridTreeChildren } from "@nanahoshi/mona-ui/grid";
import { SegmentedComponent } from "@nanahoshi/mona-ui/segmented";
import type { SegmentedOption } from "@nanahoshi/mona-ui/segmented";
import { filter, map } from "rxjs";
import type { ComponentMetadata } from "../../models/ComponentMetadata";
import { DemoService } from "../../services/demo.service";
import type { ComponentConfigInputType } from "../../utils/componentConfig";
import { DemoEventLog, readPartValues, reconcilePartValues } from "../../utils/demoParts";
import type { DemoPart, DemoPartValues } from "../../utils/demoParts";
import { deriveInputConfig } from "../../utils/deriveInputConfig";
import { PartsDemoContainerComponent } from "../parts-demo-container/parts-demo-container.component";
import { type TreeShape, type TreeTask, treeTasks } from "./grid-tree-demo.data";

type ColumnId = "hours" | "name" | "owner";

interface ColumnSpec {
    readonly code: readonly string[];
    readonly id: ColumnId;
    readonly title: string;
}

const COLUMNS: readonly ColumnSpec[] = [
    { id: "name", title: "Task column", code: ['field="name"'] },
    { id: "owner", title: "Owner column", code: ['field="owner"'] },
    { id: "hours", title: "Hours column", code: ['field="hours"', 'type="number"'] }
];

const COLUMN_TITLES: Readonly<Record<ColumnId, string>> = {
    hours: "Hours",
    name: "Task",
    owner: "Owner"
};

const CHILDREN_VALUES: readonly { readonly text: string; readonly value: GridTreeChildren<TreeTask> }[] = [
    { text: "The subtasks field", value: "subtasks" },
    { text: "A function (task => task.subtasks)", value: (task: TreeTask) => task.subtasks }
];

const PARENT_KEY_VALUES: readonly { readonly text: string; readonly value: GridKeySelector<TreeTask> }[] = [
    { text: "The parentId field", value: "parentId" },
    { text: "A function (task => task.parentId)", value: (task: TreeTask) => task.parentId }
];

/**
 * The playground of the Tree List page. It covers the inputs, output and methods of `monaGridTree`, with nested or
 * flat data, and which column has the toggles. It shares nothing with the other grid playgrounds.
 */
@Component({
    selector: "app-grid-tree-demo",
    imports: [
        ButtonDirective,
        GridColumnComponent,
        GridComponent,
        GridTreeDirective,
        PartsDemoContainerComponent,
        SegmentedComponent
    ],
    templateUrl: "./grid-tree-demo.component.html"
})
export class GridTreeDemoComponent {
    readonly #metadata = toSignal(
        inject(DemoService).metadata$.pipe(
            filter(metadata => !!metadata),
            map(metadata => metadata ?? {})
        ),
        { initialValue: {} as Record<string, ComponentMetadata> }
    );
    private readonly treeDirective = viewChild(GridTreeDirective);
    protected readonly columns = computed(() => {
        const values = this.values();
        const read = (id: ColumnId) => readPartValues<GridColumnComponent>(this.#part(id), values);
        return { hours: read("hours"), name: read("name"), owner: read("owner") };
    });
    protected readonly data = computed(() => treeTasks(this.shape()));
    protected readonly eventLog = new DemoEventLog();
    protected readonly expandedKeys = signal<readonly unknown[]>([1, 2]);
    protected readonly expandedText = computed(() => {
        const keys = this.expandedKeys();
        return keys.length === 0 ? "none" : keys.map(key => String(key)).join(", ");
    });
    protected readonly grid = computed(() => readPartValues<GridComponent<unknown>>(this.#part("grid"), this.values()));
    protected readonly parts = computed<readonly DemoPart[]>(() => {
        const metadata = this.#metadata();
        const shape = this.shape();
        const gridMetadata = metadata["GridComponent"] ?? emptyMetadata();
        const treeMetadata = metadata["GridTreeDirective"] ?? emptyMetadata();
        const columnMetadata = metadata["GridColumnComponent"] ?? emptyMetadata();
        return [
            {
                id: "grid",
                title: "Grid",
                metadata: gridMetadata,
                codeAttributes: ['[data]="tasks"', 'rowKey="id"', 'class="h-112"'],
                config: {
                    inputs: deriveInputConfig<GridComponent<unknown>>(gridMetadata, gridOverrides(), {
                        resolveAliases: true
                    })
                }
            },
            {
                id: "tree",
                title: "Tree",
                metadata: treeMetadata,
                placement: "host",
                codeAttributes: [
                    shape === "nested" ? 'children="subtasks"' : 'parentKey="parentId"',
                    '[treeExpandedKeys]="expandedKeys()"',
                    '(treeExpandedKeysChange)="expandedKeys.set($event)"'
                ],
                config: {
                    inputs: deriveInputConfig<GridTreeDirective<TreeTask>>(treeMetadata, treeOverrides(shape), {
                        resolveAliases: true
                    })
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
    protected readonly shape = signal<TreeShape>("nested");
    protected readonly shapeOptions: readonly SegmentedOption<TreeShape>[] = [
        { label: "Nested children", value: "nested" },
        { label: "Flat with parent keys", value: "flat" }
    ];
    /** Only the input of the data shape shown: the panel keeps the other one's last value. */
    protected readonly treeBinding = computed(() => {
        const values = readPartValues<GridTreeDirective<TreeTask>>(this.#part("tree"), this.values());
        return this.shape() === "nested"
            ? { children: values.children, parentKey: "" }
            : { children: "", parentKey: values.parentKey };
    });
    protected readonly values = linkedSignal<readonly DemoPart[], DemoPartValues>({
        source: this.parts,
        computation: (parts, previous) => reconcilePartValues(parts, previous?.value)
    });

    protected onCollapseAll(): void {
        this.treeDirective()?.collapseAll();
    }

    protected onExpandAll(): void {
        this.treeDirective()?.expandAll();
    }

    protected onExpandedKeysChange(keys: unknown[]): void {
        this.expandedKeys.set(keys);
        this.eventLog.record("treeExpandedKeysChange", keys);
    }

    protected onShapeChange(shape: TreeShape | null): void {
        if (shape) {
            this.shape.set(shape);
        }
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
        ariaLabel: { alias: "aria-label", type: "string", value: "Project tasks" },
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

/** How the tree finds each task's children, for the data shape shown: the other input stays empty. */
function treeOverrides(shape: TreeShape): Partial<ComponentConfigInputType<GridTreeDirective<TreeTask>>> {
    return {
        children:
            shape === "nested"
                ? {
                      type: "customDropdown",
                      value: CHILDREN_VALUES,
                      textField: "text",
                      valueField: "value",
                      defaultValue: "subtasks",
                      note: "Where each task's subtasks are. Both choices find the same ones; the code sample shows the field."
                  }
                : undefined,
        parentKey:
            shape === "flat"
                ? {
                      type: "customDropdown",
                      value: PARENT_KEY_VALUES,
                      textField: "text",
                      valueField: "value",
                      defaultValue: "parentId",
                      note: "Where each task names its parent's id. Both choices give the same; the code sample shows the field."
                  }
                : undefined,
        treeExpandedKeys: undefined
    };
}

/** The title and whether the column has the toggles. The other column inputs have pages of their own. */
function columnOverrides(id: ColumnId): Partial<ComponentConfigInputType<GridColumnComponent>> {
    return {
        aggregate: undefined,
        editable: undefined,
        expandable: {
            type: "boolean",
            value: id === "name",
            note: "Puts the toggles and the indent in this column. With none on, the first visible column has them."
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
