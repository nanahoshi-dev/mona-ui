import { Component } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { SeparatorComponent } from "@nanahoshi/mona-ui/separator";
import { TextBoxDirective } from "@nanahoshi/mona-ui/text-box";

@Component({
    selector: "app-separator-sign-in-example",
    imports: [ButtonDirective, SeparatorComponent, TextBoxDirective],
    templateUrl: "./sign-in-example.component.html"
})
export class SeparatorSignInExampleComponent {}
