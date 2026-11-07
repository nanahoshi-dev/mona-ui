import { Component } from "@angular/core";
import { CardDemoComponent } from "../../../demo/components/card-demo/card-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-card-doc",
    imports: [CardDemoComponent, MarkdownDocComponent],
    templateUrl: "./card-doc.component.html"
})
export class CardDocComponent {}
