import { Component, effect, forwardRef } from "@angular/core";
import { PopupMenuItemComponent, PopupMenuOrigin, PopupMenuToken } from "@mirei/mona-ui/popup-menu";
import { ensureMenubarComponentTypes, ensureMenubarTemplateTypes } from "../../utils/menubar.utils";

@Component({
    selector: "mona-menu-item",
    template: "",
    providers: [
        {
            provide: PopupMenuToken,
            useExisting: forwardRef(() => MenuItemComponent)
        }
    ]
})
export class MenuItemComponent extends PopupMenuItemComponent {
    public override readonly origin = PopupMenuOrigin.MenubarMenu;
    public constructor() {
        super();
        effect(() => ensureMenubarComponentTypes(this.items()));
        effect(() =>
            ensureMenubarTemplateTypes(
                [this.iconTemplateConfig(), this.shortcutTemplateConfig(), this.textTemplateConfig()].filter(
                    t => t !== undefined
                )
            )
        );
    }
}
