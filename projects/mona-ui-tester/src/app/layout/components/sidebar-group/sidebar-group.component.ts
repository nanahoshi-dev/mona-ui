import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { NavigationGroup } from "../../models/NavigationGroup";

@Component({
    selector: "app-sidebar-group",
    imports: [RouterLink, RouterLinkActive],
    templateUrl: "./sidebar-group.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarGroupComponent {
    public readonly group = input.required<NavigationGroup>();
}
