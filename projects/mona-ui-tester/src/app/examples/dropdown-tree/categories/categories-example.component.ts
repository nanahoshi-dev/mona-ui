import { Component, signal } from "@angular/core";
import { DropdownTreeComponent } from "@nanahoshi/mona-ui/dropdown-tree";
import { DropdownFilterableDirective } from "@nanahoshi/mona-ui/dropdowns";
import { FormFieldComponent } from "@nanahoshi/mona-ui/form-field";

interface Category {
    readonly id: string;
    readonly items?: readonly Category[];
    readonly name: string;
}

@Component({
    selector: "app-dropdown-tree-categories-example",
    imports: [DropdownFilterableDirective, DropdownTreeComponent, FormFieldComponent],
    templateUrl: "./categories-example.component.html"
})
export class DropdownTreeCategoriesExampleComponent {
    protected readonly categories: readonly Category[] = [
        {
            id: "clothing",
            name: "Clothing",
            items: [
                {
                    id: "tops",
                    name: "Tops",
                    items: [
                        { id: "shirts", name: "Shirts" },
                        { id: "t-shirts", name: "T-shirts" },
                        { id: "sweaters", name: "Sweaters" }
                    ]
                },
                { id: "trousers", name: "Trousers" },
                { id: "jackets", name: "Jackets" }
            ]
        },
        {
            id: "footwear",
            name: "Footwear",
            items: [
                { id: "boots", name: "Boots" },
                { id: "sandals", name: "Sandals" },
                { id: "sneakers", name: "Sneakers" }
            ]
        },
        {
            id: "accessories",
            name: "Accessories",
            items: [
                { id: "bags", name: "Bags" },
                { id: "belts", name: "Belts" },
                { id: "hats", name: "Hats" }
            ]
        }
    ];
    protected readonly category = signal<string | null>("t-shirts");
}
