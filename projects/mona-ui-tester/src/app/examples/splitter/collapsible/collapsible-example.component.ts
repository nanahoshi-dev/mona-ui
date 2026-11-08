import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { SplitterComponent, SplitterPaneComponent } from "@nanahoshi/mona-ui/splitter";

@Component({
    selector: "app-splitter-collapsible-example",
    imports: [ButtonDirective, SplitterComponent, SplitterPaneComponent],
    templateUrl: "./collapsible-example.component.html"
})
export class SplitterCollapsibleExampleComponent {
    protected readonly foldersCollapsed = signal(false);
    protected readonly foldersSize = signal<string | number>(200);
}
