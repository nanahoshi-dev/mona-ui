import { Component, signal } from "@angular/core";
import { DropdownTreeComponent, DropdownTreeValueTemplateDirective } from "@nanahoshi/mona-ui/dropdown-tree";
import { DropdownItemTemplateDirective } from "@nanahoshi/mona-ui/dropdowns";
import { FormFieldComponent } from "@nanahoshi/mona-ui/form-field";

interface Team {
    readonly archived: boolean;
    readonly id: number;
    readonly name: string;
    readonly parentId: number | null;
}

@Component({
    selector: "app-dropdown-tree-flat-data-example",
    imports: [
        DropdownItemTemplateDirective,
        DropdownTreeComponent,
        DropdownTreeValueTemplateDirective,
        FormFieldComponent
    ],
    templateUrl: "./flat-data-example.component.html"
})
export class DropdownTreeFlatDataExampleComponent {
    protected readonly team = signal<number | null>(null);
    protected readonly teams: readonly Team[] = [
        { archived: false, id: 1, name: "Engineering", parentId: null },
        { archived: false, id: 2, name: "Platform", parentId: 1 },
        { archived: false, id: 3, name: "Mobile", parentId: 1 },
        { archived: true, id: 4, name: "Desktop", parentId: 1 },
        { archived: false, id: 5, name: "Design", parentId: null },
        { archived: false, id: 6, name: "Research", parentId: 5 },
        { archived: false, id: 7, name: "Brand", parentId: 5 },
        { archived: false, id: 8, name: "Support", parentId: null }
    ];
}
