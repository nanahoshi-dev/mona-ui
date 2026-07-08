import { Component, forwardRef } from "@angular/core";
import { PopupMenuOrigin, PopupMenuSeparatorComponent, PopupMenuToken } from "@mirei/mona-ui/popup-menu";

@Component({
    selector: "mona-menu-separator",
    template: "",
    providers: [
        {
            provide: PopupMenuToken,
            useExisting: forwardRef(() => MenuSeparatorComponent)
        }
    ]
})
export class MenuSeparatorComponent extends PopupMenuSeparatorComponent {
    public override readonly origin = PopupMenuOrigin.MenubarMenu;
}
