import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { PopupComponent } from "@nanahoshi/mona-ui/popup";

@Component({
    selector: "app-popup-backdrop-example",
    imports: [ButtonDirective, PopupComponent],
    templateUrl: "./backdrop-example.component.html"
})
export class PopupBackdropExampleComponent {
    protected readonly open = signal(false);
}
