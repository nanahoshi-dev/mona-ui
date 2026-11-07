import { Component, forwardRef } from "@angular/core";
import { PopupMenuSeparatorComponent } from "@nanahoshi/mona-ui/popup-menu";
import { PopupMenuOrigin, PopupMenuToken } from "@nanahoshi/mona-ui/internal/popup-menu";

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
