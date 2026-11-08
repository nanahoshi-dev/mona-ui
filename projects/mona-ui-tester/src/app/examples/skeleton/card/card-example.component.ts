import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { SkeletonComponent } from "@nanahoshi/mona-ui/skeleton";

@Component({
    selector: "app-skeleton-card-example",
    imports: [ButtonDirective, SkeletonComponent],
    templateUrl: "./card-example.component.html"
})
export class SkeletonCardExampleComponent {
    protected readonly loading = signal(true);

    public constructor() {
        this.reload();
    }

    protected reload(): void {
        this.loading.set(true);
        // Stands in for a request to a server.
        setTimeout(() => this.loading.set(false), 1500);
    }
}
