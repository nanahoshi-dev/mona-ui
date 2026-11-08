import { Component } from "@angular/core";
import { LucideSave } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { TooltipDirective } from "@nanahoshi/mona-ui/tooltip";

@Component({
    selector: "app-tooltip-directive-template-example",
    imports: [ButtonDirective, LucideSave, TooltipDirective],
    templateUrl: "./template-example.component.html"
})
export class TooltipDirectiveTemplateExampleComponent {}
