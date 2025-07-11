import { ChangeDetectionStrategy, Component, contentChildren, forwardRef, input } from "@angular/core";
import { MenuItemComponent } from "../menu-item/menu-item.component";
import { MenuItemInjectionToken } from "../models/MenuItemInjectionToken";

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
export class MenuItemGroupComponent {
    public readonly menuItems = contentChildren(forwardRef(() => MenuItemComponent<unknown>));

    /**
     * @description The title of the menu item group.
     */
    public readonly title = input.required<string>();
}
