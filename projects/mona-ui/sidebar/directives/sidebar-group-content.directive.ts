import { Directive } from "@angular/core";
import { sidebarGroupContentThemeVariants } from "../styles/sidebar.styles";

/**
 * @description
 * The body of a `monaSidebarGroup`, below its header. Wraps the menu itself.
 */
@Directive({
    selector: "[monaSidebarGroupContent]",
    host: {
        "[class]": "baseClass"
    }
})
export class SidebarGroupContentDirective {
    protected readonly baseClass = sidebarGroupContentThemeVariants();
}
