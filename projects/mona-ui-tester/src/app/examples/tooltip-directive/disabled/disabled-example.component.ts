import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { CheckBoxComponent } from "@nanahoshi/mona-ui/check-box";
import { TooltipDirective } from "@nanahoshi/mona-ui/tooltip";

@Component({
    selector: "app-tooltip-directive-disabled-example",
    imports: [ButtonDirective, CheckBoxComponent, TooltipDirective],
    templateUrl: "./disabled-example.component.html"
})
export class TooltipDirectiveDisabledExampleComponent {
    protected readonly showHints = signal(true);
}
