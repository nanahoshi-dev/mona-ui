import { ChangeDetectionStrategy, Component, effect, forwardRef } from "@angular/core";
import { PopupMenuGroupComponent } from "../../../../common/popup-menu/components/popup-menu-group/popup-menu-group.component";
import { PopupMenuOrigin, PopupMenuToken } from "../../../../common/popup-menu/models/PopupMenuConfig";
import { ensureMenubarComponentTypes, ensureMenubarTemplateTypes } from "../../utils/menubar.utils";

@Component({
    selector: "mona-menu-group",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: PopupMenuToken,
            useExisting: forwardRef(() => MenuGroupComponent)
        }
    ]
})
export class MenuGroupComponent extends PopupMenuGroupComponent {
    public override readonly origin = PopupMenuOrigin.MenubarMenu;
    public constructor() {
        super();
        effect(() => ensureMenubarComponentTypes(this.items()));
        effect(() => ensureMenubarTemplateTypes([this.groupTemplateConfig()].filter(t => t !== undefined)));
    }
}
