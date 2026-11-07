import { Component, signal } from "@angular/core";
import type { TabSelectEvent } from "@nanahoshi/mona-ui/tabs";
import { TabComponent, TabContentTemplateDirective, TabsComponent } from "@nanahoshi/mona-ui/tabs";

@Component({
    selector: "app-tabs-cancel-select-example",
    imports: [TabComponent, TabContentTemplateDirective, TabsComponent],
    templateUrl: "./cancel-select-example.component.html"
})
export class TabsCancelSelectExampleComponent {
    protected readonly message = signal("");

    protected select(event: TabSelectEvent): void {
        if (event.index === 1) {
            event.preventDefault();
            this.message.set("Upgrade to see the Pro plan.");
            return;
        }
        this.message.set("");
    }
}
