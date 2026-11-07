import { Component } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { PopoverComponent, PopoverFooterTemplateDirective } from "@nanahoshi/mona-ui/popover";

@Component({
    selector: "app-popover-basic-example",
    imports: [ButtonDirective, PopoverComponent, PopoverFooterTemplateDirective],
    templateUrl: "./basic-example.component.html"
})
export class PopoverBasicExampleComponent {}
