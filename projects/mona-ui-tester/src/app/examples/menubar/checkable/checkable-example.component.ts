import { Component, signal } from "@angular/core";
import {
    MenubarComponent,
    MenuCheckboxItemComponent,
    MenuComponent,
    MenuItemComponent,
    MenuRadioGroupComponent,
    MenuRadioItemComponent
} from "@nanahoshi/mona-ui/menubar";

@Component({
    selector: "app-menubar-checkable-example",
    imports: [
        MenubarComponent,
        MenuCheckboxItemComponent,
        MenuComponent,
        MenuItemComponent,
        MenuRadioGroupComponent,
        MenuRadioItemComponent
    ],
    templateUrl: "./checkable-example.component.html"
})
export class MenubarCheckableExampleComponent {
    protected readonly showGrid = signal(true);
    protected readonly snapToGrid = signal(false);
    protected readonly theme = signal("system");
}
