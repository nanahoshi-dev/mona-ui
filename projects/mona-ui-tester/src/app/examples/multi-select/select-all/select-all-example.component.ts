import { Component, signal } from "@angular/core";
import { DropdownFilterableDirective } from "@nanahoshi/mona-ui/dropdowns";
import { FormFieldComponent } from "@nanahoshi/mona-ui/form-field";
import { MultiSelectComponent } from "@nanahoshi/mona-ui/multi-select";

interface Team {
    readonly archived?: boolean;
    readonly id: string;
    readonly name: string;
}

@Component({
    selector: "app-multi-select-select-all-example",
    imports: [DropdownFilterableDirective, FormFieldComponent, MultiSelectComponent],
    templateUrl: "./select-all-example.component.html"
})
export class MultiSelectSelectAllExampleComponent {
    protected readonly notified = signal<string[]>(["design"]);
    protected readonly teams: readonly Team[] = [
        { id: "design", name: "Design" },
        { id: "engineering", name: "Engineering" },
        { id: "finance", name: "Finance" },
        { archived: true, id: "legal", name: "Legal" },
        { id: "marketing", name: "Marketing" },
        { id: "sales", name: "Sales" },
        { id: "support", name: "Support" }
    ];
}
