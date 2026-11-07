import { Component } from "@angular/core";
import { LucideInbox } from "@lucide/angular";
import { PlaceholderComponent } from "@nanahoshi/mona-ui/placeholder";

@Component({
    selector: "app-placeholder-empty-state-example",
    imports: [LucideInbox, PlaceholderComponent],
    templateUrl: "./empty-state-example.component.html"
})
export class PlaceholderEmptyStateExampleComponent {}
