import { Directive } from "@angular/core";

@Directive({
    selector: "li[monaSidebarMenuItem]",
    host: {
        class: "flex flex-row items-center text-base gap-1 group/menu-item rounded-md hover:bg-accent"
    }
})
export class SidebarMenuItemDirective {}
