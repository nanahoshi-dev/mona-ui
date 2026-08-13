import { Component } from "@angular/core";
import { SpinnerDemoComponent } from "../../../demo/components/spinner-demo/spinner-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-spinner-doc",
    imports: [SpinnerDemoComponent, MarkdownDocComponent],
    templateUrl: "./spinner-doc.component.html"
})
export class SpinnerDocComponent {}
