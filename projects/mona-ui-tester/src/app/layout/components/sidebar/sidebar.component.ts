import { ChangeDetectionStrategy, Component, signal } from "@angular/core";
import { NavigationGroup } from "../../models/NavigationGroup";
import { SidebarGroupComponent } from "../sidebar-group/sidebar-group.component";

@Component({
    selector: "app-sidebar",
    imports: [SidebarGroupComponent],
    templateUrl: "./sidebar.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
    protected readonly groups = signal<NavigationGroup[]>([
        {
            title: "Get Started",
            path: "",
            items: [
                {
                    text: "Introduction",
                    path: "/introduction"
                },
                {
                    text: "Installation",
                    path: "/installation"
                }
            ]
        },
        {
            title: "Components",
            path: "/components",
            items: [
                {
                    text: "Button",
                    path: "/buttons/button"
                },
                {
                    text: "Button Group",
                    path: "/buttons/button-group"
                },
                {
                    text: "Chip",
                    path: "/chip"
                }
            ]
        }
    ]);
}
