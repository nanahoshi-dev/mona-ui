import { Directive } from "@angular/core";
import { sidebarCollapsibleThemeVariants } from "../styles/sidebar.styles";

@Directive({
    selector: "mona-expansion-panel[monaSidebarMenuCollapsible]",
    host: {
        "[class]": "baseClass"
    }
})
export class SidebarMenuCollapsibleDirective {
    protected readonly baseClass = sidebarCollapsibleThemeVariants();
}
