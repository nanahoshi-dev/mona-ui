import { Component, computed, signal } from "@angular/core";
import { PagerComponent } from "@nanahoshi/mona-ui/pager";

@Component({
    selector: "app-pager-paging-example",
    imports: [PagerComponent],
    templateUrl: "./paging-example.component.html"
})
export class PagerPagingExampleComponent {
    protected readonly books = Array.from({ length: 23 }, (_, index) => `Book ${index + 1}`);
    protected readonly pageItems = computed(() => this.books.slice(this.skip(), this.skip() + this.pageSize()));
    protected readonly pageSize = signal(5);
    protected readonly skip = signal(0);
}
