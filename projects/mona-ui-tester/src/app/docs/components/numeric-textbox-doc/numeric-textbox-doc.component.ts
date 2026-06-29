import { Component } from "@angular/core";
import { NumericTextboxDemoComponent } from "../../../demo/components/numeric-textbox-demo/numeric-textbox-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-numeric-textbox-doc",
    imports: [MarkdownDocComponent, NumericTextboxDemoComponent],
    templateUrl: "./numeric-textbox-doc.component.html"
})
export class NumericTextboxDocComponent {}
