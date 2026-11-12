import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { CardDemoComponent } from "../../../demo/components/card-demo/card-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-card-doc",
    imports: [ApiSectionComponent, CardDemoComponent, MarkdownDocComponent],
    templateUrl: "./card-doc.component.html"
})
export class CardDocComponent {}
