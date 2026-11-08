import { Component } from "@angular/core";
import { SkeletonComponent } from "@nanahoshi/mona-ui/skeleton";

@Component({
    selector: "app-skeleton-list-example",
    imports: [SkeletonComponent],
    templateUrl: "./list-example.component.html"
})
export class SkeletonListExampleComponent {
    protected readonly rows = [1, 2, 3];
}
