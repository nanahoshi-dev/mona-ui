import { ChangeDetectionStrategy, Component, effect, forwardRef } from "@angular/core";
import { PopupMenuRadioGroupComponent } from "../../../../common/popup-menu/components/popup-menu-radio-group/popup-menu-radio-group.component";
import { PopupMenuOrigin, PopupMenuToken } from "../../../../common/popup-menu/models/PopupMenuConfig";
import { ensureSplitButtonComponentTypes, ensureSplitButtonTemplateTypes } from "../../utils/split-button.utils";

@Component({
    selector: "mona-split-button-radio-group",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush,
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
