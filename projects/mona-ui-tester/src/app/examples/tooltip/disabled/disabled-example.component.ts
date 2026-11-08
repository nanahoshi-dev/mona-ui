import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { CheckBoxComponent } from "@nanahoshi/mona-ui/check-box";
import { TooltipComponent } from "@nanahoshi/mona-ui/tooltip";

@Component({
    selector: "app-tooltip-disabled-example",
    imports: [ButtonDirective, CheckBoxComponent, TooltipComponent],
    templateUrl: "./disabled-example.component.html"
})
export class TooltipDisabledExampleComponent {
    protected readonly showHints = signal(true);
}
