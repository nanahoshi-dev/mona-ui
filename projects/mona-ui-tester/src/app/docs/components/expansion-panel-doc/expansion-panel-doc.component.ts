import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { ExpansionPanelDemoComponent } from "../../../demo/components/expansion-panel-demo/expansion-panel-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-expansion-panel-doc",
    imports: [ApiSectionComponent, ExpansionPanelDemoComponent, MarkdownDocComponent],
    templateUrl: "./expansion-panel-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExpansionPanelDocComponent {}
