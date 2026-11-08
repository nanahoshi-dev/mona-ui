import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    ContextMenuCheckboxItemComponent,
    ContextMenuComponent,
    ContextMenuRadioGroupComponent,
    ContextMenuRadioItemComponent,
    ContextMenuSeparatorComponent
} from "@nanahoshi/mona-ui/contextmenu";

@Component({
    selector: "app-contextmenu-checkable-example",
    imports: [
        ButtonDirective,
        ContextMenuCheckboxItemComponent,
        ContextMenuComponent,
        ContextMenuRadioGroupComponent,
        ContextMenuRadioItemComponent,
        ContextMenuSeparatorComponent
    ],
    templateUrl: "./checkable-example.component.html"
})
export class ContextMenuCheckableExampleComponent {
    protected readonly previewPane = signal(true);
    protected readonly sortField = signal("name");
}
