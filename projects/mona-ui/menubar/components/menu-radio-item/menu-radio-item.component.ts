import { Component, effect, forwardRef } from "@angular/core";
import {
    PopupMenuOrigin,
    PopupMenuRadioItemComponent,
    PopupMenuRadioItemToken,
    PopupMenuToken
} from "@nanahoshi/mona-ui/popup-menu";
import { ensureMenubarTemplateTypes } from "../../utils/menubar.utils";

@Component({
    selector: "mona-menu-radio-item",
    template: "",
    providers: [
        {
            provide: PopupMenuToken,
            useExisting: forwardRef(() => MenuRadioItemComponent)
        },
        {
            provide: PopupMenuRadioItemToken,
            useExisting: forwardRef(() => MenuRadioItemComponent)
        }
    ]
})
export class MenuRadioItemComponent extends PopupMenuRadioItemComponent {
    public override readonly origin = PopupMenuOrigin.MenubarMenu;
    public constructor() {
        super();
        effect(() =>
            ensureMenubarTemplateTypes(
                [this.shortcutTemplateConfig(), this.textTemplateConfig()].filter(t => t !== undefined)
            )
        );
    }
}
