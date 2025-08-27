import { ChangeDetectionStrategy, Component, effect, forwardRef } from "@angular/core";
import { PopupMenuRadioItemComponent } from "../../../../common/popup-menu/components/popup-menu-radio-item/popup-menu-radio-item.component";
import {
    PopupMenuOrigin,
    PopupMenuRadioItemToken,
    PopupMenuToken
} from "../../../../common/popup-menu/models/PopupMenuConfig";
import { ensureMenubarTemplateTypes } from "../../utils/menubar.utils";

@Component({
    selector: "mona-menu-radio-item",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush,
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
