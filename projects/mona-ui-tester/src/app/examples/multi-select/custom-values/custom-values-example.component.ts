import { Component, signal } from "@angular/core";
import { DropdownFilterableDirective } from "@nanahoshi/mona-ui/dropdowns";
import { LabelDirective } from "@nanahoshi/mona-ui/label";
import { MultiSelectComponent } from "@nanahoshi/mona-ui/multi-select";

@Component({
    selector: "app-multi-select-custom-values-example",
    imports: [DropdownFilterableDirective, LabelDirective, MultiSelectComponent],
    templateUrl: "./custom-values-example.component.html"
})
export class MultiSelectCustomValuesExampleComponent {
    protected readonly skills = signal(["Angular", "CSS", "Go", "Rust", "TypeScript"]);
    protected readonly value = signal<string[]>(["Angular", "TypeScript"]);

    protected add(skill: string): void {
        this.skills.update(skills => [...skills, skill]);
        this.value.update(value => [...value, skill]);
    }
}
