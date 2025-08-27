import { ChangeDetectionStrategy, Component, effect, forwardRef } from "@angular/core";
import { PopupMenuRadioGroupComponent } from "../../../../common/popup-menu/components/popup-menu-radio-group/popup-menu-radio-group.component";
import { PopupMenuOrigin, PopupMenuToken } from "../../../../common/popup-menu/models/PopupMenuConfig";
import {
    ensureDropdownButtonComponentTypes,
    ensureDropdownButtonTemplateTypes
} from "../../utils/dropdown-button.utils";

@Component({
    selector: "mona-dropdown-button-radio-group",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: PopupMenuToken,
            useExisting: forwardRef(() => DropdownButtonRadioGroupComponent)
        }
    ]
})
export class DropdownButtonRadioGroupComponent extends PopupMenuRadioGroupComponent {
    public override readonly origin = PopupMenuOrigin.DropdownButton;
    public constructor() {
        super();
        effect(() => ensureDropdownButtonComponentTypes(this.items()));
        effect(() => ensureDropdownButtonTemplateTypes([this.groupTemplateConfig()].filter(t => t !== undefined)));
    }
}
