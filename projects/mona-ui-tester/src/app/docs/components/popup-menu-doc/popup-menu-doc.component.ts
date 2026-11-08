import { Component } from "@angular/core";
import { PopupMenuDemoComponent } from "../../../demo/components/popup-menu-demo/popup-menu-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-popup-menu-doc",
    imports: [MarkdownDocComponent, PopupMenuDemoComponent],
    templateUrl: "./popup-menu-doc.component.html"
})
export class PopupMenuDocComponent {}
