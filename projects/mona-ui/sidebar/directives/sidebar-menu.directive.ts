import { Directive } from "@angular/core";

@Directive({
    selector: "ul[monaSidebarMenu]",
    host: {
        class: "flex flex-col w-full space-y-1 ps-4 pe-2"
    }
})
export class SidebarMenuDirective {}
