import { Component, signal } from "@angular/core";
import { BreadcrumbComponent, BreadcrumbItemComponent } from "@nanahoshi/mona-ui/breadcrumb";

@Component({
    selector: "app-breadcrumb-collapsed-example",
    imports: [BreadcrumbComponent, BreadcrumbItemComponent],
    templateUrl: "./collapsed-example.component.html"
})
export class BreadcrumbCollapsedExampleComponent {
    protected readonly categories = [
        "Store",
        "Electronics",
        "Audio",
        "Headphones",
        "Over-ear",
        "Wireless",
        "Noise-cancelling headphones"
    ];
    protected readonly chosen = signal("none");
}
