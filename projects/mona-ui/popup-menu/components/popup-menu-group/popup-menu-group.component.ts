import { Component, computed, contentChild, contentChildren, forwardRef, input } from "@angular/core";
import { selectMany } from "@mirei/ts-collections";
import {
    PopupMenuConfig,
    PopupMenuGroupTemplateToken,
    PopupMenuItemType,
    PopupMenuOrigin,
    PopupMenuToken,
    PopupMenuItem
} from "@nanahoshi/mona-ui/internal/popup-menu";

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
    // One key per group: consecutive items with it form the group, and its description is the title.
    readonly #groupKey = computed(() => Symbol(this.title() ?? ""));
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
        const group = this.#groupKey();
        const menuItems = this.items().map(i =>
            i.getPopupMenuItem().map(item => ({
                ...item,
                group,
                groupTemplate: computed(() => this.groupTemplateConfig()?.template ?? null)
            }))
        );
        return selectMany(menuItems, i => i).toArray();
    }
}
