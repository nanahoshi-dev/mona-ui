import { Component, forwardRef } from "@angular/core";
import { PopupMenuSeparatorComponent } from "@nanahoshi/mona-ui/popup-menu";
import { PopupMenuOrigin, PopupMenuToken } from "@nanahoshi/mona-ui/internal/popup-menu";

@Component({
    selector: "mona-contextmenu-separator",
    template: "",
    providers: [
        {
            provide: PopupMenuToken,
            useExisting: forwardRef(() => ContextMenuSeparatorComponent)
        }
    ]
})
export class ContextMenuSeparatorComponent extends PopupMenuSeparatorComponent {
    public override readonly origin = PopupMenuOrigin.ContextMenu;
}
