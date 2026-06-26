import { ChangeDetectionStrategy, Component, effect, forwardRef } from "@angular/core";
import { PopupMenuRadioItemComponent } from "../../../../common/popup-menu/components/popup-menu-radio-item/popup-menu-radio-item.component";
import {
    PopupMenuOrigin,
    PopupMenuRadioItemToken,
    PopupMenuToken
} from "../../../../common/popup-menu/models/PopupMenuConfig";
import { ensureDropdownButtonTemplateTypes } from "../../utils/dropdown-button.utils";

@Component({
    selector: "mona-dropdown-button-radio-item",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: PopupMenuToken,
            useExisting: forwardRef(() => DropdownButtonRadioItemComponent)
        },
        {
            provide: PopupMenuRadioItemToken,
            useExisting: forwardRef(() => DropdownButtonRadioItemComponent)
        }
    ]
})
export class DropdownButtonRadioItemComponent extends PopupMenuRadioItemComponent {
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
