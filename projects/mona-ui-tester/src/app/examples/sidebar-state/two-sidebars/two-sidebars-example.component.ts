import { Component, signal } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    SidebarComponent,
    SidebarContentDirective,
    SidebarInsetDirective,
    SidebarLayoutComponent,
    SidebarMenuButtonDirective,
    SidebarMenuDirective,
    SidebarMenuItemDirective,
    SidebarTriggerDirective
} from "@nanahoshi/mona-ui/sidebar";

@Component({
    selector: "app-sidebar-state-two-sidebars-example",
    imports: [
        ButtonDirective,
        SidebarComponent,
        SidebarContentDirective,
        SidebarInsetDirective,
        SidebarLayoutComponent,
        SidebarMenuButtonDirective,
        SidebarMenuDirective,
        SidebarMenuItemDirective,
        SidebarTriggerDirective
    ],
    templateUrl: "./two-sidebars-example.component.html"
})
export class SidebarStateTwoSidebarsExampleComponent {
    protected readonly detailsOpen = signal(false);
    protected readonly navOpen = signal(true);
    protected readonly projects = ["Website redesign", "Mobile app", "Billing"];
}
