import { Component, computed, signal } from "@angular/core";
import { ListViewComponent } from "@nanahoshi/mona-ui/list-view";

const PAGE_SIZE = 15;

@Component({
    selector: "app-list-view-infinite-scroll-example",
    imports: [ListViewComponent],
    templateUrl: "./infinite-scroll-example.component.html"
})
export class ListViewInfiniteScrollExampleComponent {
    readonly #visibleCount = signal(PAGE_SIZE);
    protected readonly events = Array.from({ length: 90 }, (_, index) => ({ text: `Event ${index + 1}` }));
    protected readonly loading = signal(false);
    protected readonly visibleEvents = computed(() => this.events.slice(0, this.#visibleCount()));

    /** Fakes a slow request before the next batch is shown. */
    protected loadMore(): void {
        if (this.loading() || this.#visibleCount() >= this.events.length) {
            return;
        }
        this.loading.set(true);
        setTimeout(() => {
            this.#visibleCount.update(count => count + PAGE_SIZE);
            this.loading.set(false);
        }, 600);
    }
}
