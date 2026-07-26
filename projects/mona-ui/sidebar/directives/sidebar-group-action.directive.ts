import { Directive } from "@angular/core";

@Directive({
    selector: "button[monaSidebarGroupAction]",
    host: {
        class: "p-1 w-auto h-auto"
    }
})
export class SidebarGroupActionDirective {}
