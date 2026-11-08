import { Component, signal } from "@angular/core";
import { moveIndices } from "@nanahoshi/mona-ui/common";
import { ListBoxComponent, type ListBoxActionEvent } from "@nanahoshi/mona-ui/list-box";

interface Step {
    id: number;
    name: string;
}

@Component({
    selector: "app-list-box-reorder-example",
    imports: [ListBoxComponent],
    templateUrl: "./reorder-example.component.html"
})
export class ListBoxReorderExampleComponent {
    protected readonly steps = signal<Step[]>([
        { id: 1, name: "Run the tests" },
        { id: 2, name: "Update the changelog" },
        { id: 3, name: "Tag the release" },
        { id: 4, name: "Publish the package" },
        { id: 5, name: "Announce it" }
    ]);

    protected onAction(event: ListBoxActionEvent<Step>): void {
        if (event.action === "moveUp" || event.action === "moveDown") {
            const offset = event.action === "moveUp" ? -1 : 1;
            this.steps.update(steps => moveIndices(steps, event.selectedIndices, offset));
        } else if (event.action === "remove") {
            this.steps.update(steps => steps.filter(step => !event.selectedItems.includes(step)));
        }
    }
}
