import { ChangeDetectionStrategy, Component, forwardRef } from "@angular/core";
import { PopupMenuSeparatorComponent } from "../../../../common/popup-menu/components/popup-menu-separator/popup-menu-separator.component";
import { PopupMenuOrigin, PopupMenuToken } from "../../../../common/popup-menu/models/PopupMenuConfig";

@Component({
    selector: "mona-menu-separator",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush,
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
