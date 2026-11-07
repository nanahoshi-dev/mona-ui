import { Component, signal } from "@angular/core";
import { LucideMenu } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { SheetComponent } from "@nanahoshi/mona-ui/sheet";

@Component({
    selector: "app-sheet-navigation-example",
    imports: [ButtonDirective, LucideMenu, SheetComponent],
    templateUrl: "./navigation-example.component.html"
})
export class SheetNavigationExampleComponent {
    protected readonly current = signal("Home");
    protected readonly open = signal(false);
    protected readonly pages = ["Home", "Orders", "Customers", "Settings"];

    /** Stands in for the router, so the example stays on this page. */
    protected go(event: Event, page: string): void {
        event.preventDefault();
        this.current.set(page);
        this.open.set(false);
    }
}
