import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    ContextMenuComponent,
    ContextMenuGroupComponent,
    ContextMenuItemComponent,
    ContextMenuSeparatorComponent
} from "@nanahoshi/mona-ui/contextmenu";

@Component({
    selector: "app-contextmenu-basic-example",
    imports: [
        ButtonDirective,
        ContextMenuComponent,
        ContextMenuGroupComponent,
        ContextMenuItemComponent,
        ContextMenuSeparatorComponent
    ],
    templateUrl: "./basic-example.component.html"
})
export class ContextMenuBasicExampleComponent {
    protected readonly lastAction = signal("none");
}
