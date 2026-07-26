import { Directive } from "@angular/core";

@Directive({
    selector: "[monaSidebarGroup]",
    host: {
        // The group owns the inset for everything it contains, and keeps it the same in both states.
        // A `3rem` icon rail less this padding leaves exactly the `2rem` square a menu button becomes.
        class: "relative flex flex-col w-full p-2"
    }
})
export class SidebarGroupDirective {}
