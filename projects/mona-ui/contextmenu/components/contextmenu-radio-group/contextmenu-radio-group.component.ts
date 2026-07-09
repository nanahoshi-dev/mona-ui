import { Component, effect, forwardRef } from "@angular/core";
import { PopupMenuOrigin, PopupMenuRadioGroupComponent, PopupMenuToken } from "@nanahoshi/mona-ui/popup-menu";
import { ensureContextMenuComponentTypes, ensureContextMenuTemplateTypes } from "../../utils/ctx-menu.utils";

@Component({
    selector: "mona-contextmenu-radio-group",
    template: "",
    providers: [
        {
            provide: PopupMenuToken,
            useExisting: forwardRef(() => ContextMenuRadioGroupComponent)
        }
    ]
})
export class ContextMenuRadioGroupComponent extends PopupMenuRadioGroupComponent {
    public override readonly origin = PopupMenuOrigin.ContextMenu;
    public constructor() {
        super();
        effect(() => ensureContextMenuComponentTypes(this.items()));
        effect(() => ensureContextMenuTemplateTypes([this.groupTemplateConfig()].filter(t => t !== undefined)));
    }
}
