import { Component } from "@angular/core";
import { ScrollViewComponent, ScrollViewSlideDirective } from "@nanahoshi/mona-ui/scroll-view";

@Component({
    selector: "app-scroll-view-arrows-pager-example",
    imports: [ScrollViewComponent, ScrollViewSlideDirective],
    templateUrl: "./arrows-pager-example.component.html"
})
export class ScrollViewArrowsPagerExampleComponent {
    protected readonly highlights = [
        { text: "Up to 20 hours on a single charge.", title: "All-day battery" },
        { text: "Rated for rain, dust and the odd drop.", title: "Built to last" },
        { text: "Pairs with your phone in seconds.", title: "Easy setup" },
        { text: "Two years of repairs, no questions asked.", title: "Covered" }
    ];
}
