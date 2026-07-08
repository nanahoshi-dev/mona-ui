import { Component, effect, forwardRef } from "@angular/core";
import {
    PopupMenuOrigin,
    PopupMenuRadioItemComponent,
    PopupMenuRadioItemToken,
    PopupMenuToken
} from "@mirei/mona-ui/popup-menu";
import { ensureDropdownButtonTemplateTypes } from "../../utils/dropdown-button.utils";

@Component({
    selector: "mona-dropdown-button-radio-item",
    template: "",
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
