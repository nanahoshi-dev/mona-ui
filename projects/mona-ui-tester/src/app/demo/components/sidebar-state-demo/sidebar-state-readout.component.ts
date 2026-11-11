import { Component } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { injectSidebar } from "@nanahoshi/mona-ui/sidebar";

/** What `injectSidebar()` reports for each sidebar of the playground, read from the inset, with its commands. */
@Component({
    selector: "app-sidebar-state-readout",
    imports: [ButtonDirective],
    templateUrl: "./sidebar-state-readout.component.html"
})
export class SidebarStateReadoutComponent {
    protected readonly sidebars = [
        { controller: injectSidebar({ for: "nav" }), label: "nav" },
        { controller: injectSidebar({ for: "inspector" }), label: "inspector" }
    ];
}
