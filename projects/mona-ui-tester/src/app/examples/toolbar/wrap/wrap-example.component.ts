import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { TextBoxDirective } from "@nanahoshi/mona-ui/text-box";
import { ToolbarComponent } from "@nanahoshi/mona-ui/toolbar";

@Component({
    selector: "app-toolbar-wrap-example",
    imports: [ButtonDirective, TextBoxDirective, ToolbarComponent],
    templateUrl: "./wrap-example.component.html"
})
export class ToolbarWrapExampleComponent {
    protected readonly filters = ["Open", "Assigned to me", "Due this week", "High priority"] as const;
    protected readonly selected = signal<ReadonlySet<string>>(new Set(["Open"]));

    protected toggle(filter: string, on: boolean): void {
        this.selected.update(selected => {
            const next = new Set(selected);
            if (on) {
                next.add(filter);
            } else {
                next.delete(filter);
            }
            return next;
        });
    }
}
