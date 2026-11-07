import { Component } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { ButtonGroupComponent } from "@nanahoshi/mona-ui/button-group";
import { DropdownButtonComponent, DropdownButtonItemComponent } from "@nanahoshi/mona-ui/dropdown-button";
import { SplitButtonComponent, SplitButtonItemComponent } from "@nanahoshi/mona-ui/split-button";

@Component({
    selector: "app-button-group-with-menus-example",
    imports: [
        ButtonDirective,
        ButtonGroupComponent,
        DropdownButtonComponent,
        DropdownButtonItemComponent,
        SplitButtonComponent,
        SplitButtonItemComponent
    ],
    templateUrl: "./with-menus-example.component.html"
})
export class ButtonGroupWithMenusExampleComponent {}
