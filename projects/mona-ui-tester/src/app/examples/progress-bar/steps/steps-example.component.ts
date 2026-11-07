import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { ProgressBarComponent, ProgressBarLabelTemplateDirective } from "@nanahoshi/mona-ui/progress-bar";

@Component({
    selector: "app-progress-bar-steps-example",
    imports: [ButtonDirective, ProgressBarComponent, ProgressBarLabelTemplateDirective],
    templateUrl: "./steps-example.component.html"
})
export class ProgressBarStepsExampleComponent {
    protected readonly completed = signal(2);
    protected readonly total = 5;

    protected back(): void {
        this.completed.update(steps => Math.max(steps - 1, 0));
    }

    protected next(): void {
        this.completed.update(steps => Math.min(steps + 1, this.total));
    }
}
