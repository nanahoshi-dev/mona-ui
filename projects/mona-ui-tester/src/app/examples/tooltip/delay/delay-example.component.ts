import { Component } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { TooltipComponent } from "@nanahoshi/mona-ui/tooltip";

@Component({
    selector: "app-tooltip-delay-example",
    imports: [ButtonDirective, TooltipComponent],
    templateUrl: "./delay-example.component.html"
})
export class TooltipDelayExampleComponent {}
