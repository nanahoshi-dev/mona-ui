import { Component, signal } from "@angular/core";
import { BadgeDirective } from "@nanahoshi/mona-ui/badge";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";

@Component({
    selector: "app-badge-counts-example",
    imports: [BadgeDirective, ButtonDirective],
    templateUrl: "./counts-example.component.html"
})
export class BadgeCountsExampleComponent {
    protected readonly unread = signal(12);

    protected markAllRead(): void {
        this.unread.set(0);
    }
}
