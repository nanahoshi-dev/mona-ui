import { Component, effect, forwardRef } from "@angular/core";
import { PopupMenuGroupComponent, PopupMenuOrigin, PopupMenuToken } from "@nanahoshi/mona-ui/popup-menu";
import { ensureContextMenuComponentTypes, ensureContextMenuTemplateTypes } from "../../utils/ctx-menu.utils";

@Component({
    selector: "mona-contextmenu-group",
    template: "",
    providers: [
        {
            provide: PopupMenuToken,
            useExisting: forwardRef(() => ContextMenuGroupComponent)
        }
    ]
})
export class ContextMenuGroupComponent extends PopupMenuGroupComponent {
    public override readonly origin = PopupMenuOrigin.ContextMenu;
    public constructor() {
        super();
        effect(() => ensureContextMenuComponentTypes(this.items()));
        effect(() => ensureContextMenuTemplateTypes([this.groupTemplateConfig()].filter(t => t !== undefined)));
    }
}
