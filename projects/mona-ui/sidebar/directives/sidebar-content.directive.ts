import { Directive } from "@angular/core";

@Directive({
    selector: "[monaSidebarContent]",
    host: {
        class: "flex-1 overflow-x-hidden overflow-y-auto"
    }
})
export class SidebarContentDirective {}
