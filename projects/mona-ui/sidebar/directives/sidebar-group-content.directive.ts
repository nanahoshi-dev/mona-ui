import { Directive } from "@angular/core";
import { sidebarGroupContentThemeVariants } from "../styles/sidebar.styles";

@Directive({
    selector: "[monaSidebarGroupContent]",
    host: {
        "[class]": "baseClass"
    }
})
export class SidebarGroupContentDirective {
    protected readonly baseClass = sidebarGroupContentThemeVariants();
}
