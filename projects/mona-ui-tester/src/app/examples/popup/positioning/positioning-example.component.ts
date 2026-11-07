import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { PopupComponent } from "@nanahoshi/mona-ui/popup";

@Component({
    selector: "app-popup-positioning-example",
    imports: [ButtonDirective, PopupComponent],
    templateUrl: "./positioning-example.component.html"
})
export class PopupPositioningExampleComponent {
    protected readonly open = signal(false);
}
