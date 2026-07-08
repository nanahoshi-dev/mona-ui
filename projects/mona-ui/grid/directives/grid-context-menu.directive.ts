import { contentChildren, Directive, effect, inject, untracked } from "@angular/core";
import { ContextMenuItemComponent } from "@mirei/mona-ui/contextmenu";
import { GridService } from "../services/grid.service";

@Directive({
    selector: "[monaGridContextMenu]"
})
export class GridContextMenuDirective {
    readonly #gridService = inject(GridService);
    private readonly menuItemComponents = contentChildren(ContextMenuItemComponent);

    public constructor() {
        effect(() => {
            const menuItemComponents = this.menuItemComponents();
            untracked(() =>
                this.#gridService.contextMenuItems.update(set =>
                    set.clear().addAll(menuItemComponents.map(m => m.getPopupMenuItem()).flatMap(i => i))
                )
            );
        });
    }
}
