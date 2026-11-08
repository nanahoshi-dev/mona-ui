import { Component, signal } from "@angular/core";
import { ListViewComponent, ListViewPageableDirective } from "@nanahoshi/mona-ui/list-view";

@Component({
    selector: "app-list-view-paging-example",
    imports: [ListViewComponent, ListViewPageableDirective],
    templateUrl: "./paging-example.component.html"
})
export class ListViewPagingExampleComponent {
    protected readonly invoices = Array.from({ length: 42 }, (_, index) => ({
        label: `Invoice #${1001 + index}`
    }));
    protected readonly page = signal(1);
}
