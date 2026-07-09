import { Component, effect, forwardRef } from "@angular/core";
import { PopupMenuGroupComponent, PopupMenuOrigin, PopupMenuToken } from "@nanahoshi/mona-ui/popup-menu";
import {
    ensureDropdownButtonComponentTypes,
    ensureDropdownButtonTemplateTypes
} from "../../utils/dropdown-button.utils";

@Component({
    selector: "mona-dropdown-button-group",
    template: "",
    providers: [
        {
            provide: PopupMenuToken,
            useExisting: forwardRef(() => DropdownButtonGroupComponent)
        }
    ]
})
export class DropdownButtonGroupComponent extends PopupMenuGroupComponent {
    public override readonly origin = PopupMenuOrigin.DropdownButton;
    public constructor() {
        super();
        effect(() => ensureDropdownButtonComponentTypes(this.items()));
        effect(() => ensureDropdownButtonTemplateTypes([this.groupTemplateConfig()].filter(t => t !== undefined)));
    }
}
