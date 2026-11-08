import { Component, signal } from "@angular/core";
import type { PopupMenuItemClickEvent } from "@nanahoshi/mona-ui/popup-menu";
import {
    SplitButtonComponent,
    SplitButtonGroupComponent,
    SplitButtonItemComponent,
    SplitButtonSeparatorComponent
} from "@nanahoshi/mona-ui/split-button";

@Component({
    selector: "app-split-button-basic-example",
    imports: [SplitButtonComponent, SplitButtonGroupComponent, SplitButtonItemComponent, SplitButtonSeparatorComponent],
    templateUrl: "./basic-example.component.html"
})
export class SplitButtonBasicExampleComponent {
    protected readonly lastAction = signal("none");

    protected onMenuItemClick(event: PopupMenuItemClickEvent): void {
        this.lastAction.set(event.label);
    }
}
