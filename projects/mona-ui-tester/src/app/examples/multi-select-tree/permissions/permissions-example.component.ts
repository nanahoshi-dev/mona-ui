import { Component, signal } from "@angular/core";
import { DropdownFilterableDirective } from "@nanahoshi/mona-ui/dropdowns";
import { FormFieldComponent } from "@nanahoshi/mona-ui/form-field";
import { MultiSelectSummaryTagDirective } from "@nanahoshi/mona-ui/multi-select";
import { MultiSelectTreeComponent } from "@nanahoshi/mona-ui/multi-select-tree";

interface Permission {
    readonly id: string;
    readonly label: string;
    readonly permissions?: readonly Permission[];
}

@Component({
    selector: "app-multi-select-tree-permissions-example",
    imports: [
        DropdownFilterableDirective,
        FormFieldComponent,
        MultiSelectSummaryTagDirective,
        MultiSelectTreeComponent
    ],
    templateUrl: "./permissions-example.component.html"
})
export class MultiSelectTreePermissionsExampleComponent {
    protected readonly granted = signal<string[]>(["orders.view", "orders.refund"]);
    protected readonly permissions: readonly Permission[] = [
        {
            id: "orders",
            label: "Orders",
            permissions: [
                { id: "orders.view", label: "View orders" },
                { id: "orders.edit", label: "Edit orders" },
                { id: "orders.refund", label: "Issue refunds" }
            ]
        },
        {
            id: "products",
            label: "Products",
            permissions: [
                { id: "products.view", label: "View products" },
                { id: "products.edit", label: "Edit products" },
                { id: "products.prices", label: "Change prices" }
            ]
        },
        {
            id: "team",
            label: "Team",
            permissions: [
                { id: "team.invite", label: "Invite members" },
                { id: "team.roles", label: "Change roles" }
            ]
        }
    ];
}
