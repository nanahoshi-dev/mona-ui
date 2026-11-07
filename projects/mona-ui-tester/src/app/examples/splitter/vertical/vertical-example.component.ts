import { Component } from "@angular/core";
import { SplitterComponent, SplitterPaneComponent } from "@nanahoshi/mona-ui/splitter";

@Component({
    selector: "app-splitter-vertical-example",
    imports: [SplitterComponent, SplitterPaneComponent],
    templateUrl: "./vertical-example.component.html"
})
export class SplitterVerticalExampleComponent {}
