import { Component, signal } from "@angular/core";
import { BreadcrumbComponent, BreadcrumbItemComponent } from "@nanahoshi/mona-ui/breadcrumb";

@Component({
    selector: "app-breadcrumb-fit-example",
    imports: [BreadcrumbComponent, BreadcrumbItemComponent],
    templateUrl: "./fit-example.component.html"
})
export class BreadcrumbFitExampleComponent {
    protected readonly opened = signal("none");
    protected readonly path = [
        "Local Disk (C:)",
        "Users",
        "Public",
        "Documents",
        "Projects",
        "Mona Explorer",
        "Release notes for the next version"
    ];
}
