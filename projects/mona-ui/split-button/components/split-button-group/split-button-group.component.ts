import { Component, effect, forwardRef } from "@angular/core";
import { PopupMenuGroupComponent, PopupMenuOrigin, PopupMenuToken } from "@mirei/mona-ui/popup-menu";
import { ensureSplitButtonComponentTypes, ensureSplitButtonTemplateTypes } from "../../utils/split-button.utils";

@Component({
    selector: "mona-split-button-group",
    template: "",
    providers: [
        {
            provide: PopupMenuToken,
            useExisting: forwardRef(() => SplitButtonGroupComponent)
        }
    ]
})
export class SplitButtonGroupComponent extends PopupMenuGroupComponent {
    public override readonly origin = PopupMenuOrigin.SplitButton;
    public constructor() {
        super();
        effect(() => ensureSplitButtonComponentTypes(this.items()));
        effect(() => ensureSplitButtonTemplateTypes([this.groupTemplateConfig()].filter(t => t !== undefined)));
    }
}
