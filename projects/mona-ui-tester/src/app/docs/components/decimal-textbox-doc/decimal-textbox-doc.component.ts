import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { DecimalTextboxDemoComponent } from "../../../demo/components/decimal-textbox-demo/decimal-textbox-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-decimal-textbox-doc",
    imports: [ApiSectionComponent, MarkdownDocComponent, DecimalTextboxDemoComponent],
    templateUrl: "./decimal-textbox-doc.component.html"
})
export class DecimalTextboxDocComponent {}
