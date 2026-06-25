import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ExpansionPanelDemoComponent } from "../../../demo/components/expansion-panel-demo/expansion-panel-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-expansion-panel-doc",
    imports: [ExpansionPanelDemoComponent, MarkdownDocComponent],
    templateUrl: "./expansion-panel-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExpansionPanelDocComponent {}
