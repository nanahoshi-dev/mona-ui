import { Component, effect, forwardRef } from "@angular/core";
import { PopupMenuItemComponent } from "@nanahoshi/mona-ui/popup-menu";
import { PopupMenuOrigin, PopupMenuToken } from "@nanahoshi/mona-ui/internal/popup-menu";
import { ensureContextMenuComponentTypes, ensureContextMenuTemplateTypes } from "../../utils/ctx-menu.utils";

@Component({
    selector: "mona-contextmenu-item",
    template: ``,
    providers: [
        {
            provide: PopupMenuToken,
            useExisting: forwardRef(() => ContextMenuItemComponent)
        }
    ]
})
export class ContextMenuItemComponent extends PopupMenuItemComponent {
    public override readonly origin = PopupMenuOrigin.ContextMenu;
    public constructor() {
        super();
        effect(() => ensureContextMenuComponentTypes(this.items()));
        effect(() =>
            ensureContextMenuTemplateTypes(
                [this.iconTemplateConfig(), this.shortcutTemplateConfig(), this.textTemplateConfig()].filter(
                    t => t !== undefined
                )
            )
        );
    }
}
