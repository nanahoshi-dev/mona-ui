import { ChangeDetectionStrategy, Component, effect, forwardRef } from "@angular/core";
import { PopupMenuGroupComponent } from "../../../../common/popup-menu/components/popup-menu-group/popup-menu-group.component";
import { PopupMenuOrigin, PopupMenuToken } from "../../../../common/popup-menu/models/PopupMenuConfig";
import {
    ensureDropdownButtonComponentTypes,
    ensureDropdownButtonTemplateTypes
} from "../../utils/dropdown-button.utils";

@Component({
    selector: "mona-dropdown-button-group",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush,
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
