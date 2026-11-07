import { Component, signal } from "@angular/core";
import { LucideCircleDot } from "@lucide/angular";
import { DropdownListComponent, DropdownListValueTemplateDirective } from "@nanahoshi/mona-ui/dropdown-list";
import { DropdownItemTemplateDirective, DropdownPrefixTemplateDirective } from "@nanahoshi/mona-ui/dropdowns";
import { LabelDirective } from "@nanahoshi/mona-ui/label";

interface Status {
    description: string;
    id: number;
    name: string;
}

@Component({
    selector: "app-dropdown-list-templates-example",
    imports: [
        DropdownItemTemplateDirective,
        DropdownListComponent,
        DropdownListValueTemplateDirective,
        DropdownPrefixTemplateDirective,
        LabelDirective,
        LucideCircleDot
    ],
    templateUrl: "./templates-example.component.html"
})
export class DropdownListTemplatesExampleComponent {
    protected readonly status = signal<Status | null>(null);
    protected readonly statuses: Status[] = [
        { id: 1, name: "Open", description: "Waiting for work" },
        { id: 2, name: "In progress", description: "Someone is on it" },
        { id: 3, name: "Blocked", description: "Needs input" },
        { id: 4, name: "Done", description: "Finished" }
    ];
}
