import {
    ChangeDetectionStrategy,
    Component,
    computed,
    contentChild,
    contentChildren,
    input,
    TemplateRef
} from "@angular/core";
import { any } from "@mirei/ts-collections";
import { MenuItem, PopupMenuComponent, PopupMenuToken, preparePopupMenuItems } from "@nanahoshi/mona-ui/popup-menu";
import { v4 } from "uuid";
import { MenuIconTemplateDirective } from "../../directives/menu-icon-template.directive";
import { MenuTextTemplateDirective } from "../../directives/menu-text-template.directive";

@Component({
    selector: "mona-menu",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuComponent {
    private readonly menuItemComponents = contentChildren(PopupMenuToken, { descendants: false });

    /**
     * @description Sets the menu as disabled.
     */
    public readonly disabled = input(false);
    public readonly iconTemplate = contentChild(MenuIconTemplateDirective, {
        read: TemplateRef
    });

    /**
     * @description Sets the items of the menu.
     * If provided, it will override the menu items defined by the menu item components.
     */
    public readonly items = input<Iterable<MenuItem>>([]);
    public readonly menuItems = computed(() => {
        if (any(this.items())) {
            return preparePopupMenuItems(this.items());
        }
        return this.menuItemComponents()
            .map(item => item.getPopupMenuItem())
            .flatMap(i => i);
    });
    public readonly textTemplate = contentChild(MenuTextTemplateDirective, { read: TemplateRef });
    /**
     * @description The text of the menu.
     */
    public readonly text = input("");
    public readonly uid = v4();
    public popupMenu: PopupMenuComponent | null = null;
}
