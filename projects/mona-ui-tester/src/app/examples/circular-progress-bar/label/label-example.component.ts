import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    CircularProgressBarComponent,
    CircularProgressBarLabelTemplateDirective
} from "@nanahoshi/mona-ui/circular-progress-bar";

@Component({
    selector: "app-circular-progress-bar-label-example",
    imports: [ButtonDirective, CircularProgressBarComponent, CircularProgressBarLabelTemplateDirective],
    templateUrl: "./label-example.component.html"
})
export class CircularProgressBarLabelExampleComponent {
    protected readonly done = signal(3);
    protected readonly total = 8;

    protected completeTask(): void {
        this.done.update(done => Math.min(done + 1, this.total));
    }
}
