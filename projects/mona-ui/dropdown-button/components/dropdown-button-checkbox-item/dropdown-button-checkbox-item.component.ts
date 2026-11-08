import { Component, effect, forwardRef } from "@angular/core";
import { PopupMenuCheckboxItemComponent } from "@nanahoshi/mona-ui/popup-menu";
import { PopupMenuOrigin, PopupMenuToken } from "@nanahoshi/mona-ui/internal/popup-menu";
import { ensureDropdownButtonTemplateTypes } from "../../utils/dropdown-button.utils";

@Component({
    selector: "mona-dropdown-button-checkbox-item",
    template: "",
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
