import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    PopupMenuCheckboxItemComponent,
    PopupMenuComponent,
    PopupMenuRadioGroupComponent,
    PopupMenuRadioItemComponent,
    PopupMenuSeparatorComponent
} from "@nanahoshi/mona-ui/popup-menu";

@Component({
    selector: "app-popup-menu-checkable-example",
    imports: [
        ButtonDirective,
        PopupMenuCheckboxItemComponent,
        PopupMenuComponent,
        PopupMenuRadioGroupComponent,
        PopupMenuRadioItemComponent,
        PopupMenuSeparatorComponent
    ],
    templateUrl: "./checkable-example.component.html"
})
export class PopupMenuCheckableExampleComponent {
    protected readonly open = signal(false);
    protected readonly showHidden = signal(false);
    protected readonly sort = signal("name");
}
