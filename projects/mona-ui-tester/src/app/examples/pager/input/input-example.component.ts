import { Component, signal } from "@angular/core";
import { type PageChangeEvent, PagerComponent } from "@nanahoshi/mona-ui/pager";

@Component({
    selector: "app-pager-input-example",
    imports: [PagerComponent],
    templateUrl: "./input-example.component.html"
})
export class PagerInputExampleComponent {
    protected readonly range = signal("1–10");

    /** A real page would load `take` items starting at `skip` here. */
    protected onPageChange(event: PageChangeEvent): void {
        this.range.set(`${event.skip + 1}–${event.skip + event.take}`);
    }
}
