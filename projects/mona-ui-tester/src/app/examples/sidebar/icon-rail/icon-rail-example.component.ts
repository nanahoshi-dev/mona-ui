import { Component, signal } from "@angular/core";
import { LucideArchive, LucideDynamicIcon, LucideInbox, LucidePanelLeft, LucideSend } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    SidebarComponent,
    SidebarContentDirective,
    SidebarGroupContentDirective,
    SidebarGroupDirective,
    SidebarGroupHeaderDirective,
    SidebarGroupLabelDirective,
    SidebarInsetDirective,
    SidebarLayoutComponent,
    SidebarMenuBadgeDirective,
    SidebarMenuButtonDirective,
    SidebarMenuDirective,
    SidebarMenuItemDirective,
    SidebarRailDirective,
    SidebarTriggerDirective
} from "@nanahoshi/mona-ui/sidebar";

@Component({
    selector: "app-sidebar-icon-rail-example",
    imports: [
        ButtonDirective,
        LucideDynamicIcon,
        LucidePanelLeft,
        SidebarComponent,
        SidebarContentDirective,
        SidebarGroupContentDirective,
        SidebarGroupDirective,
        SidebarGroupHeaderDirective,
        SidebarGroupLabelDirective,
        SidebarInsetDirective,
        SidebarLayoutComponent,
        SidebarMenuBadgeDirective,
        SidebarMenuButtonDirective,
        SidebarMenuDirective,
        SidebarMenuItemDirective,
        SidebarRailDirective,
        SidebarTriggerDirective
    ],
    templateUrl: "./icon-rail-example.component.html"
})
export class SidebarIconRailExampleComponent {
    protected readonly current = signal("Inbox");
    protected readonly folders = [
        { href: "/mail/inbox", icon: LucideInbox, label: "Inbox", unread: 12 },
        { href: "/mail/sent", icon: LucideSend, label: "Sent", unread: 0 },
        { href: "/mail/archive", icon: LucideArchive, label: "Archive", unread: 0 }
    ];

    /** Stands in for the router, so the example stays on this page. */
    protected open(event: Event, label: string): void {
        event.preventDefault();
        this.current.set(label);
    }
}
