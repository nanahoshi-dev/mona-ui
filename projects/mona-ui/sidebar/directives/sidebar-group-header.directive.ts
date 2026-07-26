import { Directive } from "@angular/core";

@Directive({
    selector: "[monaSidebarGroupHeader]",
    host: {
        class: "h-8 flex items-center px-3"
    }
})
export class SidebarGroupHeaderDirective {}
