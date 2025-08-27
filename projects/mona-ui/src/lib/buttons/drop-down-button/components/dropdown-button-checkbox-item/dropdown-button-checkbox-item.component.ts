import { ChangeDetectionStrategy, Component, effect, forwardRef } from "@angular/core";
import { PopupMenuCheckboxItemComponent } from "../../../../common/popup-menu/components/popup-menu-checkbox-item/popup-menu-checkbox-item.component";
import { PopupMenuOrigin, PopupMenuToken } from "../../../../common/popup-menu/models/PopupMenuConfig";
import { ensureDropdownButtonTemplateTypes } from "../../utils/dropdown-button.utils";

@Component({
    selector: "mona-dropdown-button-checkbox-item",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: PopupMenuToken,
            useExisting: forwardRef(() => DropdownButtonCheckboxItemComponent)
        }
    ]
})
export class DropdownButtonCheckboxItemComponent extends PopupMenuCheckboxItemComponent {
    public override readonly origin = PopupMenuOrigin.DropdownButton;
    public constructor() {
        super();
        effect(() =>
            ensureDropdownButtonTemplateTypes(
                [this.shortcutTemplateConfig(), this.textTemplateConfig()].filter(t => t !== undefined)
            )
        );
    }
}
