import { Component, effect, forwardRef } from "@angular/core";
import { PopupMenuOrigin, PopupMenuRadioGroupComponent, PopupMenuToken } from "@mirei/mona-ui/popup-menu";
import { ensureSplitButtonComponentTypes, ensureSplitButtonTemplateTypes } from "../../utils/split-button.utils";

@Component({
    selector: "mona-split-button-radio-group",
    template: "",
    providers: [
        {
            provide: PopupMenuToken,
            useExisting: forwardRef(() => SplitButtonRadioGroupComponent)
        }
    ]
})
export class SplitButtonRadioGroupComponent extends PopupMenuRadioGroupComponent {
    public override readonly origin = PopupMenuOrigin.SplitButton;
    public constructor() {
        super();
        effect(() => ensureSplitButtonComponentTypes(this.items()));
        effect(() => ensureSplitButtonTemplateTypes([this.groupTemplateConfig()].filter(t => t !== undefined)));
    }
}
