import { Component, signal } from "@angular/core";
import {
    DropdownButtonCheckboxItemComponent,
    DropdownButtonComponent,
    DropdownButtonRadioGroupComponent,
    DropdownButtonRadioItemComponent,
    DropdownButtonSeparatorComponent
} from "@nanahoshi/mona-ui/dropdown-button";

@Component({
    selector: "app-dropdown-button-checkable-example",
    imports: [
        DropdownButtonCheckboxItemComponent,
        DropdownButtonComponent,
        DropdownButtonRadioGroupComponent,
        DropdownButtonRadioItemComponent,
        DropdownButtonSeparatorComponent
    ],
    templateUrl: "./checkable-example.component.html"
})
export class DropdownButtonCheckableExampleComponent {
    protected readonly notifications = signal(true);
    protected readonly priority = signal("medium");
}
