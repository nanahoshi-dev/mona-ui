import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { CollapsibleDemoComponent } from "../../../demo/components/collapsible-demo/collapsible-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-collapsible-doc",
    imports: [ApiSectionComponent, CollapsibleDemoComponent, MarkdownDocComponent],
    templateUrl: "./collapsible-doc.component.html"
})
export class CollapsibleDocComponent {}
