import { Component, signal } from "@angular/core";
import { ListBoxComponent, type ListBoxActionEvent } from "@nanahoshi/mona-ui/list-box";

interface Permission {
    id: number;
    name: string;
}

@Component({
    selector: "app-list-box-transfer-example",
    imports: [ListBoxComponent],
    templateUrl: "./transfer-example.component.html"
})
export class ListBoxTransferExampleComponent {
    protected readonly available = signal<Permission[]>([
        { id: 1, name: "Read issues" },
        { id: 2, name: "Write issues" },
        { id: 3, name: "Manage labels" },
        { id: 4, name: "Merge pull requests" },
        { id: 5, name: "Delete branches" }
    ]);
    protected readonly grantedItems = signal<Permission[]>([]);

    /** "To" actions fire on the first list box and carry the items to move into the connected one. */
    protected onAvailableAction(event: ListBoxActionEvent<Permission>): void {
        if (event.action === "transferTo" || event.action === "transferAllTo") {
            this.grantedItems.update(items => [...items, ...event.selectedItems]);
            this.available.update(items => items.filter(item => !event.selectedItems.includes(item)));
        }
    }

    /** "From" actions fire on the connected list box and carry the items to move back. */
    protected onGrantedAction(event: ListBoxActionEvent<Permission>): void {
        if (event.action === "transferFrom" || event.action === "transferAllFrom") {
            this.available.update(items => [...items, ...event.selectedItems]);
            this.grantedItems.update(items => items.filter(item => !event.selectedItems.includes(item)));
        }
    }
}
