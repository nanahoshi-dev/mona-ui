import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { MaskedTextboxDemoComponent } from "../../../demo/components/masked-textbox-demo/masked-textbox-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-masked-textbox-doc",
    imports: [ApiSectionComponent, MaskedTextboxDemoComponent, MarkdownDocComponent],
    templateUrl: "./masked-textbox-doc.component.html"
})
export class MaskedTextboxDocComponent {}
