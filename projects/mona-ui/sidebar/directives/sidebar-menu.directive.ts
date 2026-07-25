import { Directive } from "@angular/core";

@Directive({
    selector: "ul[monaSidebarMenu]",
    host: {
        class: "flex flex-col w-full space-y-1 px-2"
    }
})
export class SidebarMenuDirective {}
