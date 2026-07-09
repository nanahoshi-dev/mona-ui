import { Component, forwardRef } from "@angular/core";
import { PopupMenuOrigin, PopupMenuSeparatorComponent, PopupMenuToken } from "@nanahoshi/mona-ui/popup-menu";

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
