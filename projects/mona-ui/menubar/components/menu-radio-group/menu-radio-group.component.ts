import { Component, effect, forwardRef } from "@angular/core";
import { PopupMenuOrigin, PopupMenuRadioGroupComponent, PopupMenuToken } from "@nanahoshi/mona-ui/popup-menu";
import { ensureMenubarComponentTypes, ensureMenubarTemplateTypes } from "../../utils/menubar.utils";

@Component({
    selector: "mona-menu-radio-group",
    template: "",
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
