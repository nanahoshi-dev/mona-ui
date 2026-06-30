import { Component } from "@angular/core";
import { SplitterDemoComponent } from "../../../demo/components/splitter-demo/splitter-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-splitter-doc",
    imports: [SplitterDemoComponent, MarkdownDocComponent],
    templateUrl: "./splitter-doc.component.html"
})
export class SplitterDocComponent {}
