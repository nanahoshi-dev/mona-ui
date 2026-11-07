import { Component, forwardRef } from "@angular/core";
import { PopupMenuSeparatorComponent } from "@nanahoshi/mona-ui/popup-menu";
import { PopupMenuOrigin, PopupMenuToken } from "@nanahoshi/mona-ui/internal/popup-menu";

@Component({
    selector: "mona-dropdown-button-separator",
    template: "",
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
