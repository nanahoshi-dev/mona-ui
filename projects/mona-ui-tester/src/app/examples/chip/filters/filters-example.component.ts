import { Component, computed, signal } from "@angular/core";
import { ChipComponent } from "@nanahoshi/mona-ui/chip";

@Component({
    selector: "app-chip-filters-example",
    imports: [ChipComponent],
    templateUrl: "./filters-example.component.html"
})
export class ChipFiltersExampleComponent {
    protected readonly assignedToMe = signal(false);
    protected readonly open = signal(true);
    protected readonly summary = computed(() => {
        const filters = [
            this.open() ? "Open" : "",
            this.assignedToMe() ? "Assigned to me" : "",
            this.urgent() ? "Urgent" : ""
        ].filter(Boolean);
        return filters.length ? filters.join(", ") : "none";
    });
    protected readonly urgent = signal(false);
}
