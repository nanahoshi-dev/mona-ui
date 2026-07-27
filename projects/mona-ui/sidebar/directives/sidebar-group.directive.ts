import { Directive } from "@angular/core";
import { sidebarGroupThemeVariants } from "../styles/sidebar.styles";

/**
 * @description
 * A titled section of the sidebar, grouping a label and its menu. Stack as many as the sidebar
 * needs; each is an ordinary block, so a `monaSidebarSeparator` between them is optional.
 */
@Directive({
    selector: "[monaSidebarGroup]",
    host: {
        "[class]": "baseClass"
    }
})
export class SidebarGroupDirective {
    // The group owns the inset for everything it contains, and keeps it the same in both states.
    // A `3rem` icon rail less this padding leaves exactly the `2rem` square a menu button becomes.
    protected readonly baseClass = sidebarGroupThemeVariants();
}
