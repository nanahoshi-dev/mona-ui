import { Component } from "@angular/core";
import { SidebarStateDemoComponent } from "../../../demo/components/sidebar-state-demo/sidebar-state-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-sidebar-state-doc",
    imports: [MarkdownDocComponent, SidebarStateDemoComponent],
    templateUrl: "./sidebar-state-doc.component.html"
})
export class SidebarStateDocComponent {}
