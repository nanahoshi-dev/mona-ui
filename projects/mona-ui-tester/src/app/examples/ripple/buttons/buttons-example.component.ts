import { Component } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { ButtonGroupComponent } from "@nanahoshi/mona-ui/button-group";
import { RIPPLE_OPTIONS } from "@nanahoshi/mona-ui/ripple";

@Component({
    selector: "app-ripple-buttons-example",
    imports: [ButtonDirective, ButtonGroupComponent],
    // Turns ripples on for this example only. An application turns them on everywhere with provideRipple().
    providers: [{ provide: RIPPLE_OPTIONS, useValue: { enabled: true } }],
    templateUrl: "./buttons-example.component.html"
})
export class RippleButtonsExampleComponent {}
