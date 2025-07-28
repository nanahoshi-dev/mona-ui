import {
    ChangeDetectionStrategy,
    Component,
    contentChild,
    contentChildren,
    forwardRef,
    input,
    TemplateRef
} from "@angular/core";
import { MenuGroupTemplateDirective } from "../directives/menu-group-template.directive";
import { MenuItemComponent } from "../menu-item/menu-item.component";
import { MenuItemInjectionToken } from "../models/MenuItemInjectionToken";

@Component({
    selector: "mona-menu-item-group",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: MenuItemInjectionToken,
            useExisting: forwardRef(() => MenuItemGroupComponent)
        }
    ]
})
export class MenuItemGroupComponent {
    public readonly menuItems = contentChildren(forwardRef(() => MenuItemComponent));

    /**
     * @description The title of the menu item group.
     */
    public readonly title = input.required<string>();

    public readonly titleTemplate = contentChild(
        forwardRef(() => MenuGroupTemplateDirective),
        {
            read: TemplateRef,
            descendants: false
        }
    );
}
