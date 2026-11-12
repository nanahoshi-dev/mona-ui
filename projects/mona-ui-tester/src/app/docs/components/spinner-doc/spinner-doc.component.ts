import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { SpinnerDemoComponent } from "../../../demo/components/spinner-demo/spinner-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-spinner-doc",
    imports: [ApiSectionComponent, SpinnerDemoComponent, MarkdownDocComponent],
    templateUrl: "./spinner-doc.component.html"
})
export class SpinnerDocComponent {}
