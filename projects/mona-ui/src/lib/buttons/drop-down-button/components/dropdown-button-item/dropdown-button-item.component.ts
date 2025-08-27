import { ChangeDetectionStrategy, Component, effect, forwardRef } from "@angular/core";
import { PopupMenuItemComponent } from "../../../../common/popup-menu/components/popup-menu-item/popup-menu-item.component";
import { PopupMenuOrigin, PopupMenuToken } from "../../../../common/popup-menu/models/PopupMenuConfig";
import {
    ensureDropdownButtonComponentTypes,
    ensureDropdownButtonTemplateTypes
} from "../../utils/dropdown-button.utils";

@Component({
    selector: "mona-dropdown-button-item",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: PopupMenuToken,
            useExisting: forwardRef(() => DropdownButtonItemComponent)
        }
    ]
})
export class DropdownButtonItemComponent extends PopupMenuItemComponent {
    public override readonly origin = PopupMenuOrigin.DropdownButton;
    public constructor() {
        super();
        effect(() => ensureDropdownButtonComponentTypes(this.items()));
        effect(() =>
            ensureDropdownButtonTemplateTypes(
                [this.iconTemplateConfig(), this.shortcutTemplateConfig(), this.textTemplateConfig()].filter(
                    t => t !== undefined
                )
            )
        );
    }
}
