import { ChangeDetectionStrategy, Component, contentChildren, forwardRef, input } from "@angular/core";
import { MenuItemComponent } from "mona-ui";
import { MenuItemInjectionToken } from "mona-ui/menus/models/MenuItemInjectionToken";

@Component({
    selector: "mona-menu-item-group",
    templateUrl: "./menu-item-group.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: MenuItemInjectionToken,
            useExisting: MenuItemGroupComponent
        }
    ]
})
export class MenuItemGroupComponent<T = unknown> {
    public readonly menuItems = contentChildren(MenuItemComponent<T>);
    public readonly title = input.required<string>();
}
