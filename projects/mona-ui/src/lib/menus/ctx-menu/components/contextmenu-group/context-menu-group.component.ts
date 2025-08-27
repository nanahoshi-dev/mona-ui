import { ChangeDetectionStrategy, Component, effect, forwardRef } from "@angular/core";
import { PopupMenuGroupComponent } from "../../../../common/popup-menu/components/popup-menu-group/popup-menu-group.component";
import { PopupMenuOrigin, PopupMenuToken } from "../../../../common/popup-menu/models/PopupMenuConfig";
import { ensureContextMenuComponentTypes, ensureContextMenuTemplateTypes } from "../../utils/ctx-menu.utils";

@Component({
    selector: "mona-contextmenu-group",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush,
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
