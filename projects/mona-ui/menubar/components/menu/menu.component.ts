import { Component, computed, contentChild, contentChildren, effect, input, TemplateRef } from "@angular/core";
import { any } from "@mirei/ts-collections";
import { createElementControlId } from "@nanahoshi/mona-ui/internal";
import { MenuItem, PopupMenuComponent } from "@nanahoshi/mona-ui/popup-menu";
import { PopupMenuToken, preparePopupMenuItems } from "@nanahoshi/mona-ui/internal/popup-menu";
import { MenuIconTemplateDirective } from "../../directives/menu-icon-template.directive";
import { MenuTextTemplateDirective } from "../../directives/menu-text-template.directive";
import { ensureMenubarComponentTypes } from "../../utils/menubar.utils";

@Component({
    selector: "mona-menu",
    template: ""
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
    /**
     * @description The text of the menu.
     */
    public readonly text = input("");
    public readonly textTemplate = contentChild(MenuTextTemplateDirective, { read: TemplateRef });
    public readonly uid = createElementControlId();
    public popupMenu: PopupMenuComponent | null = null;

    public constructor() {
        effect(() => ensureMenubarComponentTypes(this.menuItemComponents()));
    }
}
