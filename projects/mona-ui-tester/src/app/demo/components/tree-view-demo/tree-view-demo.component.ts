import { NgComponentOutlet } from "@angular/common";
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    inject,
    input,
    linkedSignal,
    signal,
    untracked
} from "@angular/core";
import {
    LucideCable,
    LucideCookingPot,
    LucideDynamicIcon,
    LucideFile,
    LucideFolder,
    LucideHouseHeart,
    type LucideIconInput,
    LucideLaptop,
    LucideSmartphone
} from "@lucide/angular";
import { FilterableOptions } from "@mirei/mona-ui/common";
import {
    CheckableOptions,
    DisableOptions,
    DraggableOptions,
    ExpandableOptions,
    moveFlatTreeNode,
    moveTreeNode,
    NodeDropEvent,
    NodeItem,
    SelectableOptions,
    TreeViewCheckableDirective,
    TreeViewComponent,
    TreeViewDisableDirective,
    TreeViewDragAndDropDirective,
    TreeViewExpandableDirective,
    TreeViewFilterableDirective,
    TreeViewNodeTemplateDirective,
    TreeViewSelectableDirective
} from "@mirei/mona-ui/tree-view";
import { asapScheduler, of, switchMap, timer } from "rxjs";
import { ComponentConfig, ComponentInputsAsSignal } from "../../utils/componentConfig";
import { createFeatureInjector, FeatureConfigHandler } from "../../utils/featureInjection";
import { AbstractDemoComponent } from "../base/abstract-demo.component";
import { DemoContainerComponent } from "../demo-container/demo-container.component";
import { EventViewerComponent } from "../event-viewer/event-viewer.component";

interface TreeNodeDataItem {
    id: string;
    text: string;
    items: TreeNodeDataItem[];
    disabled?: boolean;
}

interface FlatTreeNodeDataItem {
    id: string;
    text: string;
    parentId: string | null;
    disabled?: boolean;
    type?: "category" | "product";
    icon?: LucideIconInput;
}

const childSelectors = [
    { text: "Local Data", value: "items" },
    {
        text: "Remote Data",
        value: (x: TreeNodeDataItem) =>
            timer(Math.floor(Math.random() * (1200 - 200)) + 200).pipe(switchMap(() => of(x.items)))
    }
];

const hasChildrenPredicates = [(x: TreeNodeDataItem) => x.items.length > 0];

const hasCheckboxPredicates = [
    (x: TreeNodeDataItem | FlatTreeNodeDataItem) => true,
    (x: TreeNodeDataItem | FlatTreeNodeDataItem) => x.text.endsWith("s")
];

let treeData = generateFileTreeData();
let flatTreeData = generateCatalogData();

@Component({
    selector: "app-tree-view-demo",
    imports: [DemoContainerComponent, NgComponentOutlet],
    templateUrl: "./tree-view-demo.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TreeViewDemoComponent extends AbstractDemoComponent<TreeViewComponent<TreeNodeDataItem>> {
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
                hasCheckbox: {
                    code: ``,
                    name: "Has Checkbox",
                    description: `Whether to display checkboxes for nodes.`,
                    type: "dropdown",
                    dropdownDataSource: hasCheckboxPredicates,
                    dropdownValue: hasCheckboxPredicates[0]
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
    protected readonly config = signal<ComponentConfig<TreeViewComponent<TreeNodeDataItem>>>({
        inputs: {
            animate: {
                type: "boolean",
                value: true
            },
            children: {
                type: "customDropdown",
                value: childSelectors,
                textField: "text",
                valueField: "value",
                defaultValue: childSelectors[0].value
            },
            data: {
                type: "iterable",
                value: treeData
            },
            hasChildren: {
                type: "dropdown",
                value: hasChildrenPredicates,
                defaultValue: hasChildrenPredicates[0],
                disabled: true
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
                value: "parentId"
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
    protected readonly subComponentsMetadata = this.getSubComponentsMetadata(["TreeViewCheckableDirective"]);
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
        EventViewerComponent,
        LucideDynamicIcon
    ],
    template: `
        @let featureData = features();
        @if (treeVisible()) {
            <mona-tree-view
                [animate]="animate()"
                [children]="children()"
                [data]="$any(treeData())"
                [hasChildren]="hasChildren()"
                [idField]="idField()"
                [mode]="mode()"
                [parentIdField]="parentIdField()"
                [textField]="textField()"
                [monaTreeViewCheckable]="checkable()"
                [checkBy]="'id'"
                [checkedKeys]="checkedKeys()"
                (checkedKeysChange)="checkedKeys.set($event)"
                [hasCheckbox]="hasCheckbox()"
                [monaTreeViewDisable]="disable()"
                [disableBy]="'id'"
                [disabledKeys]="disabledKeys()"
                [monaTreeViewDragAndDrop]="dragDrop()"
                (nodeDrop)="onNodeDrop($event)"
                [monaTreeViewExpandable]="expandable()"
                [expandBy]="'id'"
                [expandedKeys]="expandedKeys()"
                (expandedKeysChange)="expandedKeys.set($event)"
                [monaTreeViewFilterable]="filterable()"
                [monaTreeViewSelectable]="selectable()"
                [selectBy]="'id'"
                [selectedKeys]="selectedKeys()"
                (selectedKeysChange)="selectedKeys.set($event)"
                (selectionChange)="onSelectionChange($event)"
                #checkableDir="monaTreeViewCheckable"
                #dragDropDir="monaTreeViewDragAndDrop"
                #expandableDir="monaTreeViewExpandable"
                #filterableDir="monaTreeViewFilterable"
                #selectableDir="monaTreeViewSelectable"
                #treeView>
                @if (featureData["nodeTemplate"].active) {
                    <ng-template monaTreeViewNodeTemplate let-dataItem let-element="element">
                        <div class="flex items-center gap-2">
                            @if (mode() === "hierarchical") {
                                @let icon = dataItem.items.length === 0 ? FileIcon : FolderIcon;
                                <svg [lucideIcon]="icon" [size]="14"></svg>
                                <span>{{ dataItem.text }}</span>
                            } @else {
                                @if (dataItem.icon) {
                                    <svg [lucideIcon]="dataItem.icon" [size]="14"></svg>
                                }
                                <span>{{ dataItem.text }}</span>
                            }
                        </div>
                    </ng-template>
                }
            </mona-tree-view>

            <app-event-viewer
                [instances]="[
                    treeView,
                    checkableDir,
                    dragDropDir,
                    expandableDir,
                    filterableDir,
                    selectableDir
                ]"></app-event-viewer>
        }
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
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
    protected readonly checkedKeys = signal<string[]>([]);
    protected readonly disable = computed(() => {
        const features = this.features();
        const subFeatures = features["disable"].subFeatures || {};
        const disableSettings: DisableOptions = {
            enabled: features["disable"].active ?? false,
            disableChildren: subFeatures["disableChildren"]?.active ?? true
        };
        return disableSettings;
    });
    protected readonly disabledKeys = signal<string[]>([]);
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
    protected readonly expandedKeys = signal<string[]>([]);
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
    protected readonly hasCheckbox = computed(() => {
        const features = this.features();
        const subFeatures = features["checkable"].subFeatures || {};
        return subFeatures["hasCheckbox"]?.dropdownValue ?? null;
    });
    protected readonly selectable = computed(() => {
        const features = this.features();
        const subFeatures = features["selectable"].subFeatures || {};
        const selectableSettings: SelectableOptions = {
            enabled: features["selectable"].active ?? false,
            mode: subFeatures["mode"]?.dropdownValue ?? "single",
            childrenOnly: subFeatures["childrenOnly"]?.active ?? false,
            toggleable: subFeatures["toggleable"]?.active ?? false
        };
        return selectableSettings;
    });
    protected readonly selectedKeys = signal<string[]>([]);
    protected readonly treeData = linkedSignal(() => {
        const mode = this.mode();
        if (mode === "flat") {
            return flatTreeData;
        }
        return treeData;
    });
    protected readonly treeVisible = signal(true);
    public readonly animate = input<ReturnType<TreeViewComponent<TreeNodeDataItem>["animate"]>>(true);
    public readonly children = input<ReturnType<TreeViewComponent<TreeNodeDataItem>["children"]>>(x => x.items);
    public readonly data = input<ReturnType<TreeViewComponent<TreeNodeDataItem>["data"]>>([]);
    public readonly hasChildren = input<ReturnType<TreeViewComponent<TreeNodeDataItem>["hasChildren"]>>(null);
    public readonly idField = input<ReturnType<TreeViewComponent<TreeNodeDataItem>["idField"]>>("id");
    public readonly mode = input<ReturnType<TreeViewComponent<TreeNodeDataItem>["mode"]>>("hierarchical");
    public readonly parentIdField = input<ReturnType<TreeViewComponent<TreeNodeDataItem>["parentIdField"]>>("parentId");
    public readonly textField = input<ReturnType<TreeViewComponent<TreeNodeDataItem>["textField"]>>("text");

    public constructor() {
        effect(() => {
            this.children();
            untracked(() => {
                this.treeVisible.set(false);
                asapScheduler.schedule(() => this.treeVisible.set(true), 0);
            });
        });
        effect(() => {
            const disableSettings = this.disable();
            const mode = this.mode();
            const disabledKeys = mode === "flat" ? ["auto", "home-1"] : ["2"];
            if (disableSettings.enabled) {
                this.disabledKeys.set(disabledKeys);
            }
        });
    }

    protected onNodeDrop(event: NodeDropEvent<TreeNodeDataItem> | NodeDropEvent<FlatTreeNodeDataItem>): void {
        if (this.mode() === "hierarchical") {
            const dropEvent = event as NodeDropEvent<TreeNodeDataItem>;
            const children = this.children();
            if (children === childSelectors[1].value) {
                treeData = moveTreeNode(treeData, dropEvent, "id", "items");
                // cast to never for demo purposes, normal usage should not need it
                event.treeView.moveNode(dropEvent.sourceNode as never, event.targetNode as never, event.position);
                this.treeData.set(treeData);
            } else {
                treeData = moveTreeNode(treeData, dropEvent, "id", "items");
                this.treeData.set(treeData);
            }
        } else {
            const dropEvent = event as NodeDropEvent<FlatTreeNodeDataItem>;
            flatTreeData = moveFlatTreeNode(flatTreeData, dropEvent, "id", "parentId");
            this.treeData.set(flatTreeData);
        }
    }

    protected onSelectionChange(nodeItem: NodeItem<TreeNodeDataItem>) {
        console.log(nodeItem);
    }

    protected readonly TreeViewComponent = TreeViewComponent;
    protected readonly FileIcon = LucideFile;
    protected readonly FolderIcon = LucideFolder;
}

function generateFileTreeData(idPrefix: string = ""): TreeNodeDataItem[] {
    return [
        {
            id: `${idPrefix}1`,
            text: "src",
            items: [
                {
                    id: `${idPrefix}1-1`,
                    text: "components",
                    items: [
                        { id: `${idPrefix}1-1-1`, text: "Button.ts", items: [] },
                        { id: `${idPrefix}1-1-2`, text: "Card.ts", items: [] }
                    ]
                },
                {
                    id: `${idPrefix}1-2`,
                    text: "utils",
                    items: [{ id: `${idPrefix}1-2-1`, text: "formatters.ts", items: [] }]
                },
                { id: `${idPrefix}1-3`, text: "App.ts", items: [] },
                { id: `${idPrefix}1-4`, text: "index.ts", items: [] }
            ]
        },
        {
            id: `${idPrefix}2`,
            text: "public",
            items: [
                { id: `${idPrefix}2-1`, text: "favicon.ico", items: [] },
                { id: `${idPrefix}2-2`, text: "logo.png", items: [] }
            ]
        },
        {
            id: `${idPrefix}3`,
            text: "package.json",
            items: []
        },
        {
            id: `${idPrefix}4`,
            text: "tsconfig.json",
            items: []
        }
    ];
}

function generateCatalogData(idPrefix: string = ""): FlatTreeNodeDataItem[] {
    return [
        { id: `${idPrefix}elec`, text: "Electronics", parentId: null, type: "category", icon: LucideCable },
        {
            id: `${idPrefix}elec-1`,
            text: "Smartphones",
            parentId: `${idPrefix}elec`,
            type: "category",
            icon: LucideSmartphone
        },
        { id: `${idPrefix}elec-1-1`, text: "Model X Pro", parentId: `${idPrefix}elec-1`, type: "product" },
        { id: `${idPrefix}elec-2`, text: "Laptops", parentId: `${idPrefix}elec`, type: "category", icon: LucideLaptop },
        { id: `${idPrefix}elec-2-1`, text: "Ultrabook 13", parentId: `${idPrefix}elec-2`, type: "product" },
        { id: `${idPrefix}home`, text: "Home & Garden", parentId: null, type: "category", icon: LucideHouseHeart },
        {
            id: `${idPrefix}home-1`,
            text: "Kitchen Appliances",
            parentId: `${idPrefix}home`,
            type: "category",
            icon: LucideCookingPot
        },
        { id: `${idPrefix}home-1-1`, text: "Burr Coffee Grinder", parentId: `${idPrefix}home-1`, type: "product" },
        {
            id: `${idPrefix}home-2`,
            text: "Outdoor Furniture",
            parentId: `${idPrefix}home`,
            type: "category",
            disabled: true
        },
        { id: `${idPrefix}auto`, text: "Automotive", parentId: null, type: "category" }
    ];
}
