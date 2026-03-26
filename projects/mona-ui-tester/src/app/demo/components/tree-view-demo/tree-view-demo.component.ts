import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from "@angular/core";
import { FileIcon, FolderIcon, LucideAngularModule, LucideIconData } from "lucide-angular";
import {
    CheckableOptions,
    ChildrenSelector,
    DisableOptions,
    DraggableOptions,
    ExpandableOptions,
    FilterableOptions,
    NodeItem,
    TreeSelectableOptions,
    TreeViewCheckableDirective,
    TreeViewComponent,
    TreeViewDisableDirective,
    TreeViewDragAndDropDirective,
    TreeViewExpandableDirective,
    TreeViewFilterableDirective,
    TreeViewNodeTemplateDirective,
    TreeViewSelectableDirective
} from "mona-ui";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

interface TreeNodeDataItem {
    id: string;
    icon: LucideIconData;
    text: string;
    items: TreeNodeDataItem[];
    disabled?: boolean;
}

@Component({
    selector: "app-tree-view-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./tree-view-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TreeViewDemoComponent extends AbstractDemoComponent<TreeViewComponent<TreeNodeDataItem>> {
    readonly #childrenSelectors: NonNullable<ChildrenSelector<TreeNodeDataItem> | undefined>[] = [
        "items",
        x => x.items
    ];
    readonly #injector = createFeatureInjector({
        checkable: {
            code: ``,
            name: "Checkbox",
            description: `Checkbox feature configuration for the tree view demo.`,
            active: false,
            subFeatures: {
                checkChildren: {
                    code: ``,
                    name: "Check Children",
                    description: `Whether the child nodes are selected when a parent node is selected.`,
                    active: false
                },
                checkDisabledChildren: {
                    code: ``,
                    name: "Check Disabled Children",
                    description: `Whether the disabled child nodes are selected when a parent node is selected.`,
                    active: false
                },
                checkParents: {
                    code: ``,
                    name: "Check Parents",
                    description: `Whether the parent nodes are selected when a child node is selected.`,
                    active: false
                },
                childrenOnly: {
                    code: ``,
                    name: "Children Only",
                    description: `Whether to display checkboxes for leaf nodes only.`,
                    active: false
                },
                mode: {
                    code: ``,
                    name: "Mode",
                    description: `Selection mode for the tree view.`,
                    type: "dropdown",
                    dropdownDataSource: ["single", "multiple"],
                    dropdownValue: "single"
                }
            }
        },
        disable: {
            code: ``,
            name: "Disable",
            description: `Disable feature configuration for the tree view demo.`,
            active: false,
            subFeatures: {
                disableChildren: {
                    code: ``,
                    name: "Disable Children",
                    description: `Whether to disable children when a parent node is disabled.`,
                    active: false
                }
            }
        },
        dragAndDrop: {
            code: ``,
            name: "Drag and Drop",
            description: `Drag and drop feature configuration for the tree view demo.`,
            active: false
        },
        expandable: {
            code: ``,
            name: "Expandable Tree View",
            description: `Expandable feature configuration for the tree view demo.`,
            active: true
        },
        filterable: {
            code: ``,
            name: "Filterable Tree View",
            description: `Filterable feature configuration for the tree view demo.`,
            subFeatures: {
                caseSensitive: {
                    code: ``,
                    name: "Case Sensitive",
                    description: `Enable case sensitive filtering in the tree view.`,
                    active: false
                },
                debounce: {
                    code: ``,
                    name: "Debounce",
                    description: `Debounce time for filter input in milliseconds.`,
                    type: "number",
                    numericMin: 0,
                    numericNullable: true
                },
                operator: {
                    code: ``,
                    name: "Operator",
                    description: `Filter operator for the tree view.`,
                    type: "dropdown",
                    dropdownDataSource: ["contains", "startsWith", "endsWith"],
                    dropdownValue: "contains"
                }
            }
        },
        nodeTemplate: {
            code: ``,
            name: "Node Template",
            description: `Template for rendering tree nodes.`,
            active: false
        },
        selectable: {
            code: ``,
            name: "Selectable Tree View",
            description: `Selectable feature configuration for the tree view demo.`,
            subFeatures: {
                childrenOnly: {
                    code: ``,
                    name: "Children Only",
                    description: `Only select leaf nodes in the tree view.`,
                    active: false
                },
                mode: {
                    code: ``,
                    name: "Mode",
                    description: `Selection mode for the tree view.`,
                    active: true,
                    type: "dropdown",
                    dropdownDataSource: ["single", "multiple"],
                    dropdownValue: "single"
                },
                toggleable: {
                    code: ``,
                    name: "Toggleable",
                    description: `Whether the node selection is toggleable.`,
                    active: true
                }
            }
        }
    });
    readonly #treeData = generateFileTreeData();
    protected readonly config = signal<ComponentConfig<TreeViewComponent<TreeNodeDataItem>>>({
        inputs: {
            animate: {
                type: "boolean",
                value: true
            },
            children: {
                type: "dropdown",
                value: this.#childrenSelectors,
                defaultValue: this.#childrenSelectors[0]
            },
            data: {
                type: "iterable",
                value: this.#treeData
            },
            hasChildren: {
                type: "dropdown",
                value: [x => x.items.length > 0],
                defaultValue: undefined
            },
            idField: {
                type: "string",
                value: "id"
            },
            mode: {
                type: "dropdown",
                value: ["flat", "hierarchical"],
                defaultValue: "hierarchical"
            },
            parentIdField: {
                type: "string",
                value: ""
            },
            textField: {
                type: "string",
                value: "text"
            }
        },
        featureHandler: this.#injector.get(FeatureConfigHandler)
    });
    protected readonly featureInjector = this.#injector;
    protected readonly metadata = this.getMetadata("TreeViewComponent");
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata([]);
    protected readonly TreeViewWrapperComponent = TreeViewWrapperComponent;
}

@Component({
    imports: [
        TreeViewComponent,
        TreeViewExpandableDirective,
        TreeViewSelectableDirective,
        TreeViewDragAndDropDirective,
        TreeViewCheckableDirective,
        TreeViewDisableDirective,
        TreeViewFilterableDirective,
        TreeViewNodeTemplateDirective,
        LucideAngularModule
    ],
    template: `
        @let featureData = features();
        <mona-tree-view
            [animate]="animate()"
            [children]="children()"
            [data]="data()"
            [hasChildren]="hasChildren()"
            [idField]="idField()"
            [mode]="mode()"
            [parentIdField]="parentIdField()"
            [textField]="textField()"
            [monaTreeViewCheckable]="checkable()"
            [checkBy]="'id'"
            [checkedKeys]="checkedKeys()"
            (checkedKeysChange)="checkedKeys.set($event)"
            [monaTreeViewDisable]="disable()"
            [disableBy]="'id'"
            [disabledKeys]="disabledKeys()"
            [monaTreeViewDragAndDrop]="dragDrop()"
            [monaTreeViewExpandable]="expandable()"
            [monaTreeViewFilterable]="filterable()"
            [monaTreeViewSelectable]="selectable()"
            [selectBy]="'id'"
            [selectedKeys]="selectedKeys()"
            (selectedKeysChange)="selectedKeys.set($event)"
            (selectionChange)="onSelectionChange($event)">
            @if (featureData["nodeTemplate"].active) {
                <ng-template monaTreeViewNodeTemplate let-dataItem let-element="element">
                    <div class="flex items-center gap-2">
                        <lucide-icon [img]="dataItem.icon" [size]="14"></lucide-icon>
                        <span>{{ dataItem.text }}</span>
                    </div>
                </ng-template>
            }
        </mona-tree-view>
    `,
    host: {
        class: "w-full flex items-start!"
    }
})
class TreeViewWrapperComponent implements ComponentInputsAsSignal<TreeViewComponent<TreeNodeDataItem>> {
    protected readonly checkable = computed(() => {
        const features = this.features();
        const subFeatures = features["checkable"].subFeatures || {};
        const selectableSettings: CheckableOptions = {
            enabled: features["checkable"].active,
            mode: subFeatures["mode"]?.dropdownValue ?? "single",
            checkChildren: subFeatures["checkChildren"]?.active ?? true,
            checkDisabledChildren: subFeatures["checkDisabledChildren"]?.active ?? false,
            checkParents: subFeatures["checkParents"]?.active ?? true,
            childrenOnly: subFeatures["childrenOnly"]?.active ?? false
        };
        return selectableSettings;
    });
    protected readonly checkedKeys = signal(["1"]);
    protected readonly disable = computed(() => {
        const features = this.features();
        const subFeatures = features["disable"].subFeatures || {};
        const disableSettings: DisableOptions = {
            enabled: features["disable"].active ?? false,
            disableChildren: subFeatures["disableChildren"]?.active ?? true
        };
        return disableSettings;
    });
    protected readonly disabledKeys = signal(["2"]);
    protected readonly dragDrop = computed(() => {
        const features = this.features();
        const dragDropSettings: DraggableOptions = {
            enabled: features["dragAndDrop"].active ?? false
        };
        return dragDropSettings;
    });
    protected readonly expandable = computed(() => {
        const features = this.features();
        const expandableSettings: ExpandableOptions = { enabled: features["expandable"].active ?? false };
        return expandableSettings;
    });
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly filterable = computed(() => {
        const features = this.features();
        const subFeatures = features["filterable"].subFeatures || {};
        const filterableSettings: FilterableOptions = {
            caseSensitive: subFeatures["caseSensitive"].active ?? false,
            enabled: features["filterable"].active ?? false,
            debounce: subFeatures["debounce"].numericValue ?? 0,
            operator: subFeatures["operator"].dropdownValue ?? "contains"
        };
        return filterableSettings;
    });
    protected readonly selectable = computed(() => {
        const features = this.features();
        const subFeatures = features["selectable"].subFeatures || {};
        const selectableSettings: TreeSelectableOptions = {
            enabled: features["selectable"].active ?? false,
            mode: subFeatures["mode"]?.dropdownValue ?? "single",
            childrenOnly: subFeatures["childrenOnly"]?.active ?? false,
            toggleable: subFeatures["toggleable"]?.active ?? false
        };
        return selectableSettings;
    });
    protected readonly selectedKeys = signal<string[]>([]);
    public readonly animate = input<ReturnType<TreeViewComponent<TreeNodeDataItem>["animate"]>>(true);
    public readonly children = input<ReturnType<TreeViewComponent<TreeNodeDataItem>["children"]>>(x => x.items);
    public readonly data = input<ReturnType<TreeViewComponent<TreeNodeDataItem>["data"]>>([]);
    public readonly hasChildren = input<ReturnType<TreeViewComponent<TreeNodeDataItem>["hasChildren"]>>(null);
    public readonly idField = input<ReturnType<TreeViewComponent<TreeNodeDataItem>["idField"]>>("");
    public readonly mode = input<ReturnType<TreeViewComponent<TreeNodeDataItem>["mode"]>>("hierarchical");
    public readonly parentIdField = input<ReturnType<TreeViewComponent<TreeNodeDataItem>["parentIdField"]>>("");
    public readonly textField = input<ReturnType<TreeViewComponent<TreeNodeDataItem>["textField"]>>("");

    public constructor() {
        effect(() => {
            console.log(this.checkedKeys());
        });
    }

    protected onSelectionChange(nodeItem: NodeItem<TreeNodeDataItem>) {
        console.log(nodeItem);
    }
}

function generateFileTreeData(): TreeNodeDataItem[] {
    return [
        {
            id: "1",
            text: "src",
            icon: FolderIcon,
            items: [
                {
                    id: "1-1",
                    text: "components",
                    icon: FolderIcon,
                    items: [
                        { id: "1-1-1", icon: FileIcon, text: "Button.ts", items: [] },
                        { id: "1-1-2", icon: FileIcon, text: "Card.ts", items: [] }
                    ]
                },
                {
                    id: "1-2",
                    text: "utils",
                    icon: FolderIcon,
                    items: [{ id: "1-2-1", icon: FileIcon, text: "formatters.ts", items: [] }]
                },
                { id: "1-3", icon: FileIcon, text: "App.ts", items: [] },
                { id: "1-4", icon: FileIcon, text: "index.ts", items: [] }
            ]
        },
        {
            id: "2",
            text: "public",
            icon: FolderIcon,
            items: [
                { id: "2-1", icon: FileIcon, text: "favicon.ico", items: [] },
                { id: "2-2", icon: FileIcon, text: "logo.png", items: [] }
            ]
        },
        {
            id: "3",
            text: "package.json",
            icon: FileIcon,
            items: []
        },
        {
            id: "4",
            text: "tsconfig.json",
            icon: FileIcon,
            items: []
        }
    ];
}
