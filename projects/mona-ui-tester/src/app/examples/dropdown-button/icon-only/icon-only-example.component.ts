import { Component } from "@angular/core";
import { LucideEllipsis } from "@lucide/angular";
import {
    DropdownButtonComponent,
    DropdownButtonItemComponent,
    DropdownButtonTextTemplateDirective
} from "@nanahoshi/mona-ui/dropdown-button";

@Component({
    selector: "app-dropdown-button-icon-only-example",
    imports: [DropdownButtonComponent, DropdownButtonItemComponent, DropdownButtonTextTemplateDirective, LucideEllipsis],
    templateUrl: "./icon-only-example.component.html"
})
export class DropdownButtonIconOnlyExampleComponent {}
