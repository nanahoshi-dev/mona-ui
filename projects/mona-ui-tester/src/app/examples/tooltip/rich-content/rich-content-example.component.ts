import { Component } from "@angular/core";
import { LucideCircleCheck } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { TooltipComponent } from "@nanahoshi/mona-ui/tooltip";

@Component({
    selector: "app-tooltip-rich-content-example",
    imports: [ButtonDirective, LucideCircleCheck, TooltipComponent],
    templateUrl: "./rich-content-example.component.html"
})
export class TooltipRichContentExampleComponent {}
