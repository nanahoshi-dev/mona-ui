import { Component, signal } from "@angular/core";
import {
    DropdownButtonComponent,
    DropdownButtonGroupComponent,
    DropdownButtonItemComponent,
    DropdownButtonSeparatorComponent
} from "@nanahoshi/mona-ui/dropdown-button";

@Component({
    selector: "app-dropdown-button-groups-example",
    imports: [
        DropdownButtonComponent,
        DropdownButtonGroupComponent,
        DropdownButtonItemComponent,
        DropdownButtonSeparatorComponent
    ],
    templateUrl: "./groups-example.component.html"
})
export class DropdownButtonGroupsExampleComponent {
    protected readonly lastAction = signal("none");
}
