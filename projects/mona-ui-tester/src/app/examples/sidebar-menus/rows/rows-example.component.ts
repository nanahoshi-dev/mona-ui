import { Component, signal } from "@angular/core";
import {
    LucideArchive,
    LucideCirclePlus,
    LucideEllipsis,
    LucideInbox,
    LucidePanelLeft,
    LucideSend,
    LucideTrash2
} from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { PopupMenuComponent, PopupMenuItemComponent } from "@nanahoshi/mona-ui/popup-menu";
import {
    SidebarComponent,
    SidebarContentDirective,
    SidebarGroupActionDirective,
    SidebarGroupContentDirective,
    SidebarGroupDirective,
    SidebarGroupHeaderDirective,
    SidebarGroupLabelDirective,
    SidebarInsetDirective,
    SidebarLayoutComponent,
    SidebarMenuActionDirective,
    SidebarMenuBadgeDirective,
    SidebarMenuButtonDirective,
    SidebarMenuDirective,
    SidebarMenuItemDirective,
    SidebarMenuSkeletonComponent,
    SidebarTriggerDirective
} from "@nanahoshi/mona-ui/sidebar";

@Component({
    selector: "app-sidebar-menus-rows-example",
    imports: [
        ButtonDirective,
        LucideArchive,
        LucideCirclePlus,
        LucideEllipsis,
        LucideInbox,
        LucidePanelLeft,
        LucideSend,
        LucideTrash2,
        PopupMenuComponent,
        PopupMenuItemComponent,
        SidebarComponent,
        SidebarContentDirective,
        SidebarGroupActionDirective,
        SidebarGroupContentDirective,
        SidebarGroupDirective,
        SidebarGroupHeaderDirective,
        SidebarGroupLabelDirective,
        SidebarInsetDirective,
        SidebarLayoutComponent,
        SidebarMenuActionDirective,
        SidebarMenuBadgeDirective,
        SidebarMenuButtonDirective,
        SidebarMenuDirective,
        SidebarMenuItemDirective,
        SidebarMenuSkeletonComponent,
        SidebarTriggerDirective
    ],
    templateUrl: "./rows-example.component.html"
})
export class SidebarMenusRowsExampleComponent {
    protected readonly current = signal("Inbox");
    protected readonly labelWidths = ["70%", "45%", "60%"];

    /** Stands in for the router, so the example stays on this page. */
    protected open(event: Event, label: string): void {
        event.preventDefault();
        this.current.set(label);
    }
}
