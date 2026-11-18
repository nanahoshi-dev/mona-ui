import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { SeparatorDemoComponent } from "../../../demo/components/separator-demo/separator-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-separator-doc",
    imports: [ApiSectionComponent, SeparatorDemoComponent, MarkdownDocComponent],
    templateUrl: "./separator-doc.component.html"
})
export class SeparatorDocComponent {}
