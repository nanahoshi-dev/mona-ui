import { Component, signal } from "@angular/core";
import { PagerComponent } from "@nanahoshi/mona-ui/pager";

@Component({
    selector: "app-pager-page-sizes-example",
    imports: [PagerComponent],
    templateUrl: "./page-sizes-example.component.html"
})
export class PagerPageSizesExampleComponent {
    protected readonly pageSize = signal(25);
}
