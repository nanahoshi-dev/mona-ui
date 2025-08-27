import { ChangeDetectionStrategy, Component, effect, forwardRef } from "@angular/core";
import { PopupMenuCheckboxItemComponent } from "../../../../common/popup-menu/components/popup-menu-checkbox-item/popup-menu-checkbox-item.component";
import { PopupMenuOrigin, PopupMenuToken } from "../../../../common/popup-menu/models/PopupMenuConfig";
import { ensureMenubarTemplateTypes } from "../../utils/menubar.utils";

@Component({
    selector: "mona-menu-checkbox-item",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: PopupMenuToken,
            useExisting: forwardRef(() => MenuCheckboxItemComponent)
        }
    ]
})
export class MenuCheckboxItemComponent extends PopupMenuCheckboxItemComponent {
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
