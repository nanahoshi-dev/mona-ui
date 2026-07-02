import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { TreeViewDemoComponent } from "../../../demo/components/tree-view-demo/tree-view-demo.component";
import { SectionComponent } from "../../../layout/components/section/section.component";

@Component({
    selector: "app-tree-view-doc",
    imports: [CodeViewerComponent, SectionComponent, TreeViewDemoComponent],
    templateUrl: "./tree-view-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TreeViewDocComponent {
    protected readonly importCode = `import { TreeViewComponent } from "mona-ui";`;

    protected readonly quickStartTsCode = `
        protected readonly data = [
            {
                text: "src",
                items: [
                    { text: "index.ts", items: [] },
                    { text: "app.ts", items: [] }
                ]
            },
            { text: "package.json", items: [] }
        ];
    `;

    protected readonly quickStartHtmlCode = `
        <mona-tree-view [data]="data" children="items" textField="text"></mona-tree-view>
    `;

    protected readonly nodeTemplateCode = `
        <mona-tree-view [data]="data" children="items" textField="text">
            <ng-template monaTreeViewNodeTemplate let-dataItem let-element="element">
                <span>{{ dataItem.text }}</span>
            </ng-template>
        </mona-tree-view>
    `;

    protected readonly flatDataCode = `
        protected readonly data = [
            { id: "1", text: "Electronics", parentId: null },
            { id: "1-1", text: "Laptops", parentId: "1" },
            { id: "1-2", text: "Phones", parentId: "1" }
        ];
    `;

    protected readonly flatDataHtmlCode = `
        <mona-tree-view
            [data]="data"
            mode="flat"
            idField="id"
            parentIdField="parentId"
            textField="text"></mona-tree-view>
    `;

    protected readonly selectableCode = `
        <mona-tree-view
            [data]="data"
            children="items"
            textField="text"
            monaTreeViewSelectable
            [monaTreeViewSelectable]="{ mode: 'single' }"
            [selectedKeys]="selectedKeys()"
            (selectedKeysChange)="selectedKeys.set($event)"></mona-tree-view>
    `;

    protected readonly checkableCode = `
        <mona-tree-view
            [data]="data"
            children="items"
            textField="text"
            monaTreeViewCheckable
            [checkedKeys]="checkedKeys()"
            (checkedKeysChange)="checkedKeys.set($event)"></mona-tree-view>
    `;

    protected readonly disableCode = `
        <mona-tree-view
            [data]="data"
            children="items"
            textField="text"
            monaTreeViewDisable
            [disabledKeys]="['1-2']"></mona-tree-view>
    `;

    protected readonly expandableCode = `
        <mona-tree-view
            [data]="data"
            children="items"
            textField="text"
            monaTreeViewExpandable
            [expandedKeys]="expandedKeys()"
            (expandedKeysChange)="expandedKeys.set($event)"></mona-tree-view>
    `;

    protected readonly filterableCode = `
        <mona-tree-view
            [data]="data"
            children="items"
            textField="text"
            monaTreeViewFilterable
            [filter]="filter()"
            (filterChange)="filter.set($event.filter)"></mona-tree-view>
    `;

    protected readonly dragAndDropCode = `
        import { moveTreeNode, NodeDropEvent } from "mona-ui";

        protected onNodeDrop(event: NodeDropEvent<MyItem>): void {
            this.data.set(moveTreeNode(this.data(), event, "id", "items"));
        }
    `;

    protected readonly dragAndDropHtmlCode = `
        <mona-tree-view
            [data]="data()"
            children="items"
            textField="text"
            monaTreeViewDragAndDrop
            (nodeDrop)="onNodeDrop($event)"></mona-tree-view>
    `;

    protected readonly lazyLoadingCode = `
        protected readonly data = [
            { id: "1", text: "Documents", items: [] }
        ];

        protected loadChildren(item: MyItem) {
            return this.api.getChildren(item.id); // Observable<MyItem[]>
        }
    `;

    protected readonly lazyLoadingHtmlCode = `
        <mona-tree-view
            [data]="data"
            [children]="loadChildren"
            [hasChildren]="hasChildren"
            textField="text"></mona-tree-view>
    `;
}
