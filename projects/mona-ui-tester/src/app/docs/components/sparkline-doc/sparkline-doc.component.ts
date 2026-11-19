import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { SparklineDemoComponent } from "../../../demo/components/sparkline-demo/sparkline-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-sparkline-doc",
    imports: [ApiSectionComponent, SparklineDemoComponent, MarkdownDocComponent],
    templateUrl: "./sparkline-doc.component.html"
})
export class SparklineDocComponent {}
