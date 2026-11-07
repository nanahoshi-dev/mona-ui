import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { WindowComponent, WindowFooterTemplateDirective } from "@nanahoshi/mona-ui/window";

@Component({
    selector: "app-window-basic-example",
    imports: [ButtonDirective, WindowComponent, WindowFooterTemplateDirective],
    templateUrl: "./basic-example.component.html"
})
export class WindowBasicExampleComponent {
    protected readonly open = signal(false);
}
