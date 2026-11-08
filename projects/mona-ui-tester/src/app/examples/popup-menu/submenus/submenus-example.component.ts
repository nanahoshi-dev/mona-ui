import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    PopupMenuComponent,
    PopupMenuGroupComponent,
    PopupMenuItemComponent,
    PopupMenuSeparatorComponent
} from "@nanahoshi/mona-ui/popup-menu";

@Component({
    selector: "app-popup-menu-submenus-example",
    imports: [
        ButtonDirective,
        PopupMenuComponent,
        PopupMenuGroupComponent,
        PopupMenuItemComponent,
        PopupMenuSeparatorComponent
    ],
    templateUrl: "./submenus-example.component.html"
})
export class PopupMenuSubmenusExampleComponent {
    protected readonly lastAction = signal("none");
    protected readonly open = signal(false);
}
