import { Component, effect, forwardRef } from "@angular/core";
import { PopupMenuItemComponent, PopupMenuOrigin, PopupMenuToken } from "@mirei/mona-ui/popup-menu";
import {
    ensureDropdownButtonComponentTypes,
    ensureDropdownButtonTemplateTypes
} from "../../utils/dropdown-button.utils";

@Component({
    selector: "mona-dropdown-button-item",
    template: "",
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
