import { Component, signal } from "@angular/core";
import { LucideDynamicIcon, LucideHouse, LucideSettings, LucideUsers } from "@lucide/angular";
import {
    SidebarComponent,
    SidebarContentDirective,
    SidebarInsetDirective,
    SidebarLayoutComponent,
    SidebarMenuButtonDirective,
    SidebarMenuDirective,
    SidebarMenuItemDirective,
    SidebarRailDirective
} from "@nanahoshi/mona-ui/sidebar";
import { SidebarStatusComponent } from "./sidebar-status.component";

@Component({
    selector: "app-sidebar-state-remembered-example",
    imports: [
        LucideDynamicIcon,
        SidebarComponent,
        SidebarContentDirective,
        SidebarInsetDirective,
        SidebarLayoutComponent,
        SidebarMenuButtonDirective,
        SidebarMenuDirective,
        SidebarMenuItemDirective,
        SidebarRailDirective,
        SidebarStatusComponent
    ],
    templateUrl: "./remembered-example.component.html"
})
export class SidebarStateRememberedExampleComponent {
    protected readonly expanded = signal(true);
    protected readonly pages = [
        { icon: LucideHouse, label: "Home" },
        { icon: LucideUsers, label: "Team" },
        { icon: LucideSettings, label: "Settings" }
    ];
}
