import { ChangeDetectionStrategy, Component, effect, forwardRef } from "@angular/core";
import { PopupMenuCheckboxItemComponent } from "../../../../common/popup-menu/components/popup-menu-checkbox-item/popup-menu-checkbox-item.component";
import { PopupMenuOrigin, PopupMenuToken } from "../../../../common/popup-menu/models/PopupMenuConfig";
import { ensureSplitButtonTemplateTypes } from "../../utils/split-button.utils";

@Component({
    selector: "mona-split-button-checkbox-item",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush,
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
