import { Component } from "@angular/core";
import { SidebarOverviewDemoComponent } from "../../../demo/components/sidebar-overview-demo/sidebar-overview-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-sidebar-doc",
    imports: [MarkdownDocComponent, SidebarOverviewDemoComponent],
    templateUrl: "./sidebar-doc.component.html"
})
export class SidebarDocComponent {}
