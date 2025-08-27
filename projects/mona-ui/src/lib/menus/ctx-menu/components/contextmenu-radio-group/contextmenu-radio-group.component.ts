import { ChangeDetectionStrategy, Component, effect, forwardRef } from "@angular/core";
import { PopupMenuRadioGroupComponent } from "../../../../common/popup-menu/components/popup-menu-radio-group/popup-menu-radio-group.component";
import { PopupMenuOrigin, PopupMenuToken } from "../../../../common/popup-menu/models/PopupMenuConfig";
import { ensureContextMenuComponentTypes, ensureContextMenuTemplateTypes } from "../../utils/ctx-menu.utils";

@Component({
    selector: "mona-contextmenu-radio-group",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush,
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
