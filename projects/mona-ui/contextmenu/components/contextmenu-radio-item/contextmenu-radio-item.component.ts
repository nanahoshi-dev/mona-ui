import { Component, effect, forwardRef } from "@angular/core";
import {
    PopupMenuOrigin,
    PopupMenuRadioItemComponent,
    PopupMenuRadioItemToken,
    PopupMenuToken
} from "@nanahoshi/mona-ui/popup-menu";
import { ensureContextMenuTemplateTypes } from "../../utils/ctx-menu.utils";

@Component({
    selector: "mona-contextmenu-radio-item",
    template: "",
    providers: [
        {
            provide: PopupMenuToken,
            useExisting: forwardRef(() => ContextMenuRadioItemComponent)
        },
        {
            provide: PopupMenuRadioItemToken,
            useExisting: forwardRef(() => ContextMenuRadioItemComponent)
        }
    ]
})
export class ContextMenuRadioItemComponent extends PopupMenuRadioItemComponent {
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
