import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { BadgeDemoComponent } from "../../../demo/components/badge-demo/badge-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-badge-doc",
    imports: [ApiSectionComponent, BadgeDemoComponent, MarkdownDocComponent],
    templateUrl: "./badge-doc.component.html"
})
export class BadgeDocComponent {}
