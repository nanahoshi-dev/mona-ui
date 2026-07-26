import { Directive } from "@angular/core";

@Directive({
    selector: "[monaSidebarGroupContent]",
    host: {
        class: "w-full"
    }
})
export class SidebarGroupContentDirective {}
