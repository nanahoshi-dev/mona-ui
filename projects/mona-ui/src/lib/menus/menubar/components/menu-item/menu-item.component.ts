import { ChangeDetectionStrategy, Component, effect, forwardRef } from "@angular/core";
import { PopupMenuItemComponent } from "../../../../common/popup-menu/components/popup-menu-item/popup-menu-item.component";
import { PopupMenuOrigin, PopupMenuToken } from "../../../../common/popup-menu/models/PopupMenuConfig";
import { ensureMenubarComponentTypes, ensureMenubarTemplateTypes } from "../../utils/menubar.utils";

@Component({
    selector: "mona-menu-item",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush,
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
