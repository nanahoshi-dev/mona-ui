import { Directive } from "@angular/core";

@Directive({
    selector: "[monaSidebarGroup]",
    host: {
        class: "relative flex flex-col w-full"
    }
})
export class SidebarGroupDirective {}
