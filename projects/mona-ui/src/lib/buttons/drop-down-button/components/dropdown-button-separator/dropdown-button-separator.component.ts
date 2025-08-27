import { ChangeDetectionStrategy, Component, forwardRef } from "@angular/core";
import { PopupMenuSeparatorComponent } from "../../../../common/popup-menu/components/popup-menu-separator/popup-menu-separator.component";
import { PopupMenuOrigin, PopupMenuToken } from "../../../../common/popup-menu/models/PopupMenuConfig";

@Component({
    selector: "mona-dropdown-button-separator",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: PopupMenuToken,
            useExisting: forwardRef(() => DropdownButtonSeparatorComponent)
        }
    ]
})
export class DropdownButtonSeparatorComponent extends PopupMenuSeparatorComponent {
    public override readonly origin = PopupMenuOrigin.DropdownButton;
}
