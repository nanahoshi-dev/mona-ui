import { Component, computed, signal } from "@angular/core";
import { PlaceholderComponent } from "@nanahoshi/mona-ui/placeholder";
import { TextBoxDirective } from "@nanahoshi/mona-ui/text-box";

const COUNTRIES = ["Argentina", "Canada", "Ghana", "Japan", "Norway", "Portugal"];

@Component({
    selector: "app-placeholder-no-results-example",
    imports: [PlaceholderComponent, TextBoxDirective],
    templateUrl: "./no-results-example.component.html"
})
export class PlaceholderNoResultsExampleComponent {
    protected readonly query = signal("");
    protected readonly results = computed(() => {
        const query = this.query().trim().toLowerCase();
        return COUNTRIES.filter(country => country.toLowerCase().includes(query));
    });
}
