import { Component, effect, forwardRef } from "@angular/core";
import { PopupMenuCheckboxItemComponent, PopupMenuOrigin, PopupMenuToken } from "@nanahoshi/mona-ui/popup-menu";
import { ensureSplitButtonTemplateTypes } from "../../utils/split-button.utils";

@Component({
    selector: "mona-split-button-checkbox-item",
    template: "",
    providers: [
        {
            provide: PopupMenuToken,
            useExisting: forwardRef(() => SplitButtonCheckboxItemComponent)
        }
    ]
})
export class SplitButtonCheckboxItemComponent extends PopupMenuCheckboxItemComponent {
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
