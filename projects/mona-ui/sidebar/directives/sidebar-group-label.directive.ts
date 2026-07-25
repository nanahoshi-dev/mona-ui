import { Directive } from "@angular/core";

@Directive({
    selector: "[monaSidebarGroupLabel]",
    host: {
        class: "flex grow-1 items-center shrink-0 text-xs font-medium text-foreground/80" // TODO: Introduce --color-sidebar-foreground
    }
})
export class SidebarGroupLabelDirective {}
