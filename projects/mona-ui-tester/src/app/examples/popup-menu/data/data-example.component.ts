import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import type { MenuItem, PopupMenuItemClickEvent } from "@nanahoshi/mona-ui/popup-menu";
import { PopupMenuComponent } from "@nanahoshi/mona-ui/popup-menu";

@Component({
    selector: "app-popup-menu-data-example",
    imports: [ButtonDirective, PopupMenuComponent],
    templateUrl: "./data-example.component.html"
})
export class PopupMenuDataExampleComponent {
    protected readonly items: MenuItem[] = [
        { label: "Edit", value: "edit" },
        {
            label: "Share",
            items: [
                { label: "Copy link", value: "copy-link" },
                { label: "Email", value: "email" }
            ]
        },
        { label: "", separator: true },
        { label: "Archive", value: "archive" }
    ];
    protected readonly lastValue = signal("none");
    protected readonly open = signal(false);

    protected onAction(event: PopupMenuItemClickEvent): void {
        this.lastValue.set(String(event.value));
    }
}
