import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { SidebarOverviewDemoComponent } from "../../../demo/components/sidebar-overview-demo/sidebar-overview-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-sidebar-doc",
    imports: [ApiSectionComponent, MarkdownDocComponent, SidebarOverviewDemoComponent],
    templateUrl: "./sidebar-doc.component.html"
})
export class SidebarDocComponent {}
