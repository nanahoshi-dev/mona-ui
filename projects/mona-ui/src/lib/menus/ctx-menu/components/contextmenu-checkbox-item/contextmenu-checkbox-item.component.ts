import { ChangeDetectionStrategy, Component, effect, forwardRef } from "@angular/core";
import { PopupMenuCheckboxItemComponent } from "../../../../common/popup-menu/components/popup-menu-checkbox-item/popup-menu-checkbox-item.component";
import { PopupMenuOrigin, PopupMenuToken } from "../../../../common/popup-menu/models/PopupMenuConfig";
import { ensureContextMenuTemplateTypes } from "../../utils/ctx-menu.utils";

@Component({
    selector: "mona-contextmenu-checkbox-item",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush,
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
