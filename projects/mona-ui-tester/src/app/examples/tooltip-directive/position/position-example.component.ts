import { Component } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { TooltipDirective } from "@nanahoshi/mona-ui/tooltip";

@Component({
    selector: "app-tooltip-directive-position-example",
    imports: [ButtonDirective, TooltipDirective],
    templateUrl: "./position-example.component.html"
})
export class TooltipDirectivePositionExampleComponent {}
