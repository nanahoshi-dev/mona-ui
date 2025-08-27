import { ChangeDetectionStrategy, Component, effect, forwardRef } from "@angular/core";
import { PopupMenuRadioGroupComponent } from "../../../../common/popup-menu/components/popup-menu-radio-group/popup-menu-radio-group.component";
import { PopupMenuOrigin, PopupMenuToken } from "../../../../common/popup-menu/models/PopupMenuConfig";
import { ensureMenubarComponentTypes, ensureMenubarTemplateTypes } from "../../utils/menubar.utils";

@Component({
    selector: "mona-menu-radio-group",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: PopupMenuToken,
            useExisting: forwardRef(() => MenuRadioGroupComponent)
        }
    ]
})
export class MenuRadioGroupComponent extends PopupMenuRadioGroupComponent {
    public override readonly origin = PopupMenuOrigin.MenubarMenu;
    public constructor() {
        super();
        effect(() => ensureMenubarComponentTypes(this.items()));
        effect(() => ensureMenubarTemplateTypes([this.groupTemplateConfig()].filter(t => t !== undefined)));
    }
}
