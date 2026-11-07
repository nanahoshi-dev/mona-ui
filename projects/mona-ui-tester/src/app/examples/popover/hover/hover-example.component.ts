import { Component } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { PopoverComponent } from "@nanahoshi/mona-ui/popover";

@Component({
    selector: "app-popover-hover-example",
    imports: [ButtonDirective, PopoverComponent],
    templateUrl: "./hover-example.component.html"
})
export class PopoverHoverExampleComponent {}
