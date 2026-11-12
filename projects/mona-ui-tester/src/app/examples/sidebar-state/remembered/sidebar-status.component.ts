import { Component } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { injectSidebar } from "@nanahoshi/mona-ui/sidebar";

/** A toolbar in the inset that reads the layout's sidebar and drives it, with no binding to it. */
@Component({
    selector: "app-sidebar-status",
    imports: [ButtonDirective],
    templateUrl: "./sidebar-status.component.html"
})
export class SidebarStatusComponent {
    protected readonly sidebar = injectSidebar();
}
