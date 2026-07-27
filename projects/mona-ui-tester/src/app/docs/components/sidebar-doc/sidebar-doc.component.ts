import { Component } from "@angular/core";
import { SidebarDemoComponent } from "../../../demo/components/sidebar-demo/sidebar-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-sidebar-doc",
    imports: [MarkdownDocComponent, SidebarDemoComponent],
    templateUrl: "./sidebar-doc.component.html"
})
export class SidebarDocComponent {}
