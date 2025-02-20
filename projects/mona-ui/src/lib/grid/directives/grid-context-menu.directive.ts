import { contentChildren, Directive, effect, inject, untracked } from "@angular/core";
import { MenuItemComponent } from "../../menus/menu-item/menu-item.component";
import { GridService } from "../services/grid.service";

@Directive({
    selector: "[monaGridContextMenu]",
    standalone: true
})
export class GridContextMenuDirective {
    readonly #gridService = inject(GridService);
    private readonly menuItemComponents = contentChildren(MenuItemComponent);

    public constructor() {
        effect(() => {
            const menuItemComponents = this.menuItemComponents();
            untracked(() =>
                this.#gridService.contextMenuItems.update(set =>
                    set.clear().addAll(menuItemComponents.map(m => m.getMenuItem()))
                )
            );
        });
    }
}
