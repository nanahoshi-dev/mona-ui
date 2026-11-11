import { Component } from "@angular/core";
import { LucideBookOpen, LucideChevronRight, LucideFolder, LucidePanelLeft } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    CollapsibleContentDirective,
    CollapsibleDirective,
    CollapsibleTriggerDirective
} from "@nanahoshi/mona-ui/collapsible";
import {
    SidebarComponent,
    SidebarContentDirective,
    SidebarInsetDirective,
    SidebarLayoutComponent,
    SidebarMenuButtonDirective,
    SidebarMenuDirective,
    SidebarMenuItemDirective,
    SidebarMenuSubDirective,
    SidebarTriggerDirective
} from "@nanahoshi/mona-ui/sidebar";

@Component({
    selector: "app-sidebar-menus-submenus-example",
    imports: [
        ButtonDirective,
        CollapsibleContentDirective,
        CollapsibleDirective,
        CollapsibleTriggerDirective,
        LucideBookOpen,
        LucideChevronRight,
        LucideFolder,
        LucidePanelLeft,
        SidebarComponent,
        SidebarContentDirective,
        SidebarInsetDirective,
        SidebarLayoutComponent,
        SidebarMenuButtonDirective,
        SidebarMenuDirective,
        SidebarMenuItemDirective,
        SidebarMenuSubDirective,
        SidebarTriggerDirective
    ],
    templateUrl: "./submenus-example.component.html"
})
export class SidebarMenusSubmenusExampleComponent {
    protected readonly pages = ["Button", "Card", "Tabs"];
}
