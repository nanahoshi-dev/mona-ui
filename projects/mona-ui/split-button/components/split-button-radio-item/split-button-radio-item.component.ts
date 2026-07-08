import { Component, effect, forwardRef } from "@angular/core";
import {
    PopupMenuOrigin,
    PopupMenuRadioItemComponent,
    PopupMenuRadioItemToken,
    PopupMenuToken
} from "@mirei/mona-ui/popup-menu";
import { ensureSplitButtonTemplateTypes } from "../../utils/split-button.utils";

@Component({
    selector: "mona-split-button-radio-item",
    template: "",
    providers: [
        {
            provide: PopupMenuToken,
            useExisting: forwardRef(() => SplitButtonRadioItemComponent)
        },
        {
            provide: PopupMenuRadioItemToken,
            useExisting: forwardRef(() => SplitButtonRadioItemComponent)
        }
    ]
})
export class SplitButtonRadioItemComponent extends PopupMenuRadioItemComponent {
    public override readonly origin = PopupMenuOrigin.SplitButton;
    public constructor() {
        super();
        effect(() =>
            ensureSplitButtonTemplateTypes(
                [this.shortcutTemplateConfig(), this.textTemplateConfig()].filter(t => t !== undefined)
            )
        );
    }
}
