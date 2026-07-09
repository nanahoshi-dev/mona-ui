import { Component, effect, forwardRef } from "@angular/core";
import { PopupMenuOrigin, PopupMenuRadioGroupComponent, PopupMenuToken } from "@nanahoshi/mona-ui/popup-menu";
import {
    ensureDropdownButtonComponentTypes,
    ensureDropdownButtonTemplateTypes
} from "../../utils/dropdown-button.utils";

@Component({
    selector: "mona-dropdown-button-radio-group",
    template: "",
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
