import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { WindowComponent } from "@nanahoshi/mona-ui/window";

@Component({
    selector: "app-window-position-example",
    imports: [ButtonDirective, WindowComponent],
    templateUrl: "./position-example.component.html"
})
export class WindowPositionExampleComponent {
    protected readonly height = signal<number | undefined>(200);
    protected readonly left = signal<number | undefined>(undefined);
    protected readonly open = signal(false);
    protected readonly top = signal<number | undefined>(undefined);
    protected readonly width = signal<number | undefined>(320);
}
