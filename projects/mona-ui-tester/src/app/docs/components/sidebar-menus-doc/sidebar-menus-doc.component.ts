import { Component } from "@angular/core";
import { ApiSectionComponent } from "../../../api/components/api-section/api-section.component";
import { SidebarMenusDemoComponent } from "../../../demo/components/sidebar-menus-demo/sidebar-menus-demo.component";
import { MarkdownDocComponent } from "../../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-sidebar-menus-doc",
    imports: [ApiSectionComponent, MarkdownDocComponent, SidebarMenusDemoComponent],
    templateUrl: "./sidebar-menus-doc.component.html"
})
export class SidebarMenusDocComponent {}
