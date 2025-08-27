import { ChangeDetectionStrategy, Component, effect, forwardRef } from "@angular/core";
import { PopupMenuItemComponent } from "../../../../common/popup-menu/components/popup-menu-item/popup-menu-item.component";
import { PopupMenuOrigin, PopupMenuToken } from "../../../../common/popup-menu/models/PopupMenuConfig";
import { ensureSplitButtonComponentTypes, ensureSplitButtonTemplateTypes } from "../../utils/split-button.utils";

@Component({
    selector: "mona-split-button-item",
    imports: [],
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush,
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
