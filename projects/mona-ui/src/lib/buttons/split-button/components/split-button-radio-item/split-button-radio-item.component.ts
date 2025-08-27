import { ChangeDetectionStrategy, Component, effect, forwardRef } from "@angular/core";
import { PopupMenuRadioItemComponent } from "../../../../common/popup-menu/components/popup-menu-radio-item/popup-menu-radio-item.component";
import {
    PopupMenuOrigin,
    PopupMenuRadioItemToken,
    PopupMenuToken
} from "../../../../common/popup-menu/models/PopupMenuConfig";
import { ensureSplitButtonTemplateTypes } from "../../utils/split-button.utils";

@Component({
    selector: "mona-split-button-radio-item",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush,
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
