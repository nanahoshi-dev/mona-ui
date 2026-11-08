import { Component } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { TooltipComponent } from "@nanahoshi/mona-ui/tooltip";

@Component({
    selector: "app-tooltip-position-example",
    imports: [ButtonDirective, TooltipComponent],
    templateUrl: "./position-example.component.html"
})
export class TooltipPositionExampleComponent {}
