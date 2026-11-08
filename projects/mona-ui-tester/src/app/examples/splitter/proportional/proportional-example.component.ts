import { Component } from "@angular/core";
import { SplitterComponent, SplitterPaneComponent } from "@nanahoshi/mona-ui/splitter";

@Component({
    selector: "app-splitter-proportional-example",
    imports: [SplitterComponent, SplitterPaneComponent],
    templateUrl: "./proportional-example.component.html"
})
export class SplitterProportionalExampleComponent {}
