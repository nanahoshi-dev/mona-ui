import { Component, effect, forwardRef } from "@angular/core";
import { PopupMenuItemComponent, PopupMenuOrigin, PopupMenuToken } from "@mirei/mona-ui/popup-menu";
import { ensureSplitButtonComponentTypes, ensureSplitButtonTemplateTypes } from "../../utils/split-button.utils";

@Component({
    selector: "mona-split-button-item",
    imports: [],
    template: "",
    providers: [
        {
            provide: PopupMenuToken,
            useExisting: forwardRef(() => SplitButtonItemComponent)
        }
    ]
})
export class SplitButtonItemComponent extends PopupMenuItemComponent {
    public override readonly origin = PopupMenuOrigin.SplitButton;
    public constructor() {
        super();
        effect(() => ensureSplitButtonComponentTypes(this.items()));
        effect(() =>
            ensureSplitButtonTemplateTypes(
                [this.iconTemplateConfig(), this.shortcutTemplateConfig(), this.textTemplateConfig()].filter(
                    t => t !== undefined
                )
            )
        );
    }
}
