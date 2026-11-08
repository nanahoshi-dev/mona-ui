import { Component, signal } from "@angular/core";
import { BreadcrumbComponent, BreadcrumbItemComponent } from "@nanahoshi/mona-ui/breadcrumb";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";

@Component({
    selector: "app-breadcrumb-buttons-example",
    imports: [BreadcrumbComponent, BreadcrumbItemComponent, ButtonDirective],
    templateUrl: "./buttons-example.component.html"
})
export class BreadcrumbButtonsExampleComponent {
    protected readonly fullPath = ["Home", "Documents", "Projects", "Reports"];
    protected readonly path = signal(this.fullPath);

    /** Opening a parent folder drops the folders below it from the path. */
    protected openFolder(index: number): void {
        this.path.update(path => path.slice(0, index + 1));
    }
}
