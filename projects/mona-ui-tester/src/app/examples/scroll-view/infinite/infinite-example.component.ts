import { Component } from "@angular/core";
import { ScrollViewComponent, ScrollViewSlideDirective } from "@nanahoshi/mona-ui/scroll-view";

@Component({
    selector: "app-scroll-view-infinite-example",
    imports: [ScrollViewComponent, ScrollViewSlideDirective],
    templateUrl: "./infinite-example.component.html"
})
export class ScrollViewInfiniteExampleComponent {
    protected readonly quotes = [
        { author: "Priya, team lead", text: "We moved our whole board over in an afternoon." },
        { author: "Tomás, designer", text: "The keyboard shortcuts alone saved me hours." },
        { author: "Mei, support", text: "Our customers notice how fast it is." }
    ];
}
