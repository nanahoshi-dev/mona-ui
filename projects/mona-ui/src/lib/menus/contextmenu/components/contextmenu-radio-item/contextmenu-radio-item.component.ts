import { ChangeDetectionStrategy, Component, effect, forwardRef } from "@angular/core";
import { PopupMenuRadioItemComponent } from "../../../../common/popup-menu/components/popup-menu-radio-item/popup-menu-radio-item.component";
import {
    PopupMenuOrigin,
    PopupMenuRadioItemToken,
    PopupMenuToken
} from "../../../../common/popup-menu/models/PopupMenuConfig";
import { ensureContextMenuTemplateTypes } from "../../utils/ctx-menu.utils";

@Component({
    selector: "mona-contextmenu-radio-item",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush,
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
