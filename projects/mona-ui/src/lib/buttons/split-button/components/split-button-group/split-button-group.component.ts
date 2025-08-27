import { ChangeDetectionStrategy, Component, effect, forwardRef } from "@angular/core";
import { PopupMenuGroupComponent } from "../../../../common/popup-menu/components/popup-menu-group/popup-menu-group.component";
import { PopupMenuOrigin, PopupMenuToken } from "../../../../common/popup-menu/models/PopupMenuConfig";
import { ensureSplitButtonComponentTypes, ensureSplitButtonTemplateTypes } from "../../utils/split-button.utils";

@Component({
    selector: "mona-split-button-group",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush,
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
