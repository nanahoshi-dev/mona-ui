import { Component, effect, forwardRef } from "@angular/core";
import { PopupMenuCheckboxItemComponent, PopupMenuOrigin, PopupMenuToken } from "@mirei/mona-ui/popup-menu";
import { ensureContextMenuTemplateTypes } from "../../utils/ctx-menu.utils";

@Component({
    selector: "mona-contextmenu-checkbox-item",
    template: "",
    providers: [
        {
            provide: PopupMenuToken,
            useExisting: forwardRef(() => ContextMenuCheckboxItemComponent)
        }
    ]
})
export class ContextMenuCheckboxItemComponent extends PopupMenuCheckboxItemComponent {
    public override readonly origin = PopupMenuOrigin.ContextMenu;
    public constructor() {
        super();
        effect(() =>
            ensureContextMenuTemplateTypes(
                [this.shortcutTemplateConfig(), this.textTemplateConfig()].filter(t => t !== undefined)
            )
        );
    }
}
