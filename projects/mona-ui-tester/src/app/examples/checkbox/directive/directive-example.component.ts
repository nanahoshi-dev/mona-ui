import { Component, signal } from "@angular/core";
import { CheckboxDirective } from "@nanahoshi/mona-ui/check-box";

@Component({
    selector: "app-checkbox-directive-example",
    imports: [CheckboxDirective],
    templateUrl: "./directive-example.component.html"
})
export class CheckboxDirectiveExampleComponent {
    protected readonly chosen = signal<readonly string[]>(["Comments"]);
    protected readonly topics = ["Comments", "Mentions", "New followers"];

    protected toggle(topic: string, event: Event): void {
        const { checked } = event.target as HTMLInputElement;
        this.chosen.update(chosen => (checked ? [...chosen, topic] : chosen.filter(item => item !== topic)));
    }
}
