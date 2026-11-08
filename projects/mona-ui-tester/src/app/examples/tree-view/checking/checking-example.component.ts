import { Component, computed, signal } from "@angular/core";
import {
    TreeViewCheckableDirective,
    TreeViewComponent,
    TreeViewExpandableDirective
} from "@nanahoshi/mona-ui/tree-view";

@Component({
    selector: "app-tree-view-checking-example",
    imports: [TreeViewCheckableDirective, TreeViewComponent, TreeViewExpandableDirective],
    templateUrl: "./checking-example.component.html"
})
export class TreeViewCheckingExampleComponent {
    protected readonly categories = [
        { id: 1, text: "Electronics", parentId: null },
        { id: 2, text: "Laptops", parentId: 1 },
        { id: 3, text: "Phones", parentId: 1 },
        { id: 4, text: "Home", parentId: null },
        { id: 5, text: "Kitchen", parentId: 4 },
        { id: 6, text: "Garden", parentId: 4 },
        { id: 7, text: "Lighting", parentId: 4 }
    ];
    protected readonly checkedKeys = signal<number[]>([3]);
    protected readonly checkedNames = computed(() =>
        this.categories.filter(category => this.checkedKeys().includes(category.id)).map(category => category.text)
    );
}
