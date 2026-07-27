import { Component, computed, contentChild, contentChildren, forwardRef, input } from "@angular/core";
import { selectMany } from "@mirei/ts-collections";
import { v4 } from "uuid";
import {
    PopupMenuConfig,
    PopupMenuGroupTemplateToken,
    PopupMenuItemType,
    PopupMenuOrigin,
    PopupMenuToken
} from "../../models/PopupMenuConfig";
import { PopupMenuItem } from "../../models/PopupMenuItem";

@Component({
    selector: "mona-popup-menu-group",
    template: ``,
    providers: [
        {
            provide: PopupMenuToken,
            useExisting: forwardRef(() => PopupMenuGroupComponent)
        }
    ]
})
export class PopupMenuGroupComponent implements PopupMenuConfig {
    readonly #groupSymbol = Symbol(v4());
    protected readonly groupTemplateConfig = contentChild(PopupMenuGroupTemplateToken, {
        descendants: false
    });
    protected readonly items = contentChildren(PopupMenuToken, { descendants: false });
    public readonly origin: PopupMenuOrigin = PopupMenuOrigin.Popup;

    /**
     * @description Sets the title of the menu group.
     */
    public readonly title = input<string>();
    public readonly type = PopupMenuItemType.MenuGroup;

    public getPopupMenuItem(): PopupMenuItem[] {
        const menuItems = this.items().map(i =>
            i.getPopupMenuItem().map(item => ({
                ...item,
                group: this.title() || this.#groupSymbol,
                groupTemplate: computed(() => this.groupTemplateConfig()?.template ?? null)
            }))
        );
        return selectMany(menuItems, i => i).toArray();
    }
}
