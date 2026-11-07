import { Component, signal } from "@angular/core";
import { SplitterComponent, SplitterPaneComponent } from "@nanahoshi/mona-ui/splitter";

@Component({
    selector: "app-splitter-save-layout-example",
    imports: [SplitterComponent, SplitterPaneComponent],
    templateUrl: "./save-layout-example.component.html"
})
export class SplitterSaveLayoutExampleComponent {
    protected readonly layout = signal<readonly (string | number)[]>([200, ""]);
}
