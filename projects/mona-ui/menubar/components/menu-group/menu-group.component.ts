import { Component, effect, forwardRef } from "@angular/core";
import { PopupMenuGroupComponent, PopupMenuOrigin, PopupMenuToken } from "@nanahoshi/mona-ui/popup-menu";
import { ensureMenubarComponentTypes, ensureMenubarTemplateTypes } from "../../utils/menubar.utils";

@Component({
    selector: "mona-menu-group",
    template: "",
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
