import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { SplitterDemoComponent } from "../../../demo/components/splitter-demo/splitter-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-splitter-doc",
    imports: [ApiSectionComponent, SplitterDemoComponent, MarkdownDocComponent],
    templateUrl: "./splitter-doc.component.html"
})
export class SplitterDocComponent {}
