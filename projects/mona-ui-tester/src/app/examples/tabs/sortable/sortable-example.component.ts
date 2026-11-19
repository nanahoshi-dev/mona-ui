import { Component, signal } from "@angular/core";
import { moveItem } from "@nanahoshi/mona-ui/sortable";
import {
    type TabReorderEvent,
    TabComponent,
    TabContentTemplateDirective,
    TabsComponent
} from "@nanahoshi/mona-ui/tabs";

@Component({
    selector: "app-tabs-sortable-example",
    imports: [TabComponent, TabContentTemplateDirective, TabsComponent],
    templateUrl: "./sortable-example.component.html"
})
export class TabsSortableExampleComponent {
    protected readonly files = signal(["index.html", "styles.css", "main.ts", "README.md"]);

    /** The tabs only report the move; reordering the data is what moves the tab. */
    protected reorder(event: TabReorderEvent): void {
        this.files.update(files => moveItem(files, event.previousIndex, event.currentIndex));
    }
}
