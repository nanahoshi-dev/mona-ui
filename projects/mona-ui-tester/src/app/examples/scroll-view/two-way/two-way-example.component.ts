import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { ScrollViewComponent, ScrollViewSlideDirective } from "@nanahoshi/mona-ui/scroll-view";

@Component({
    selector: "app-scroll-view-two-way-example",
    imports: [ButtonDirective, ScrollViewComponent, ScrollViewSlideDirective],
    templateUrl: "./two-way-example.component.html"
})
export class ScrollViewTwoWayExampleComponent {
    protected readonly page = signal(0);
    protected readonly steps = [
        "Create a project and give it a name.",
        "Invite the people you work with.",
        "Add your first task and assign it."
    ];
}
