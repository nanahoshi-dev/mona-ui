import { Component, forwardRef } from "@angular/core";
import { PopupMenuOrigin, PopupMenuSeparatorComponent, PopupMenuToken } from "@mirei/mona-ui/popup-menu";

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
