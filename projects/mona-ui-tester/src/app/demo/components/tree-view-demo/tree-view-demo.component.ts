import { NgComponentOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from "@angular/core";
import {
    ChildrenSelector,
    ExpandableOptions,
    TreeSelectableOptions,
    TreeViewCheckableDirective,
    TreeViewComponent,
    TreeViewDragAndDropDirective,
    TreeViewExpandableDirective,
    TreeViewSelectableDirective
} from "mona-ui";
import { CheckableOptions } from "mona-ui/common/tree/models/CheckableOptions";
import { DraggableOptions } from "mona-ui/common/tree/models/DraggableOptions";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";

interface TreeNodeDataItem {
    id: string;
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
            active: true,
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
                    active: true,
                    type: "dropdown",
                    dropdownDataSource: ["single", "multiple"],
                    dropdownValue: "single"
                }
            }
        },
        dragAndDrop: {
            code: ``,
            name: "Drag and Drop",
            description: `Drag and drop feature configuration for the tree view demo.`,
            active: true
        },
        expandable: {
            code: ``,
            name: "Expandable Tree View",
            description: `Expandable feature configuration for the tree view demo.`,
            active: true
        },
        selectable: {
            code: ``,
            name: "Selectable Tree View",
            description: `Selectable feature configuration for the tree view demo.`,
            active: true,
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
        TreeViewCheckableDirective
    ],
    template: `
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
            [monaTreeViewDragAndDrop]="dragDrop()"
            [monaTreeViewExpandable]="expandable()"
            [monaTreeViewSelectable]="selectable()">
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
    protected readonly checkedKeys = signal([]);
    protected readonly dragDrop = computed(() => {
        const features = this.features();
        const dragDropSettings: DraggableOptions = {
            enabled: features["dragAndDrop"].active
        };
        return dragDropSettings;
    });
    protected readonly expandable = computed(() => {
        const features = this.features();
        const expandableSettings: ExpandableOptions = { enabled: features["expandable"].active };
        return expandableSettings;
    });
    protected readonly features = inject(FeatureConfigHandler).data;
    protected readonly selectable = computed(() => {
        const features = this.features();
        const subFeatures = features["selectable"].subFeatures || {};
        const selectableSettings: TreeSelectableOptions = {
            enabled: features["selectable"].active,
            mode: subFeatures["mode"]?.dropdownValue ?? "single",
            childrenOnly: subFeatures["childrenOnly"]?.active ?? false,
            toggleable: subFeatures["toggleable"]?.active ?? false
        };
        return selectableSettings;
    });
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
}

function generateFileTreeData(): TreeNodeDataItem[] {
    return [
        {
            id: "1",
            text: "src",
            items: [
                {
                    id: "1-1",
                    text: "components",
                    items: [
                        { id: "1-1-1", text: "Button.ts", items: [] },
                        { id: "1-1-2", text: "Card.ts", items: [] }
                    ]
                },
                {
                    id: "1-2",
                    text: "utils",
                    items: [{ id: "1-2-1", text: "formatters.ts", items: [] }]
                },
                { id: "1-3", text: "App.ts", items: [] },
                { id: "1-4", text: "index.ts", items: [] }
            ]
        },
        {
            id: "2",
            text: "public",
            items: [
                { id: "2-1", text: "favicon.ico", items: [] },
                { id: "2-2", text: "logo.png", items: [] }
            ]
        },
        {
            id: "3",
            text: "package.json",
            items: []
        },
        {
            id: "4",
            text: "tsconfig.json",
            items: []
        }
    ];
}

function generateRandomTreeData(nodeCount: number): TreeNodeDataItem[] {
    function generateNode(idPrefix: string, remainingNodes: number): [any, number] {
        const node: TreeNodeDataItem = {
            text: Math.random().toString(36).substring(7),
            id: idPrefix,
            items: []
        };

        if (remainingNodes > 0) {
            const childCount = Math.min(Math.floor(Math.random() * remainingNodes), remainingNodes);
            for (let i = 0; i < childCount; i++) {
                const [childNode, newRemainingNodes] = generateNode(`${idPrefix}-${i + 1}`, remainingNodes - 1);
                node.items.push(childNode);
                remainingNodes = newRemainingNodes;
            }
        }

        return [node, remainingNodes];
    }

    const trees: TreeNodeDataItem[] = [];
    let remainingNodes = nodeCount;
    let rootId = 1;
    while (remainingNodes > 0) {
        const [tree, newRemainingNodes] = generateNode(rootId.toString(), remainingNodes - 1);
        trees.push(tree);
        remainingNodes = newRemainingNodes;
        rootId++;
    }

    return trees;
}
