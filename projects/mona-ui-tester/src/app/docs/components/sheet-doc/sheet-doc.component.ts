import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { SheetDemoComponent } from "../../../demo/components/sheet-demo/sheet-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-sheet-doc",
    imports: [ApiSectionComponent, MarkdownDocComponent, SheetDemoComponent],
    templateUrl: "./sheet-doc.component.html"
})
export class SheetDocComponent {}
