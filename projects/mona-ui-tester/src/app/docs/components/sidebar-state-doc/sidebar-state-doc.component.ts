import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { SidebarStateDemoComponent } from "../../../demo/components/sidebar-state-demo/sidebar-state-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-sidebar-state-doc",
    imports: [ApiSectionComponent, MarkdownDocComponent, SidebarStateDemoComponent],
    templateUrl: "./sidebar-state-doc.component.html"
})
export class SidebarStateDocComponent {}
