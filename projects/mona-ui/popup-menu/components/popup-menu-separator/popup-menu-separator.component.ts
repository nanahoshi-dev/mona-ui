import { Component, forwardRef } from "@angular/core";
import {
    PopupMenuItem,
    PopupMenuConfig,
    PopupMenuItemType,
    PopupMenuOrigin,
    PopupMenuToken
} from "@nanahoshi/mona-ui/internal/popup-menu";

@Component({
    selector: "mona-popup-menu-separator",
    template: "",
    providers: [
        {
            provide: PopupMenuToken,
            useExisting: forwardRef(() => PopupMenuSeparatorComponent)
        }
    ]
})
export class PopupMenuSeparatorComponent implements PopupMenuConfig {
    public readonly origin: PopupMenuOrigin = PopupMenuOrigin.Popup;
    public readonly type = PopupMenuItemType.Separator;
    public getPopupMenuItem(): PopupMenuItem[] {
        return [
            {
                disabled: true,
                group: Symbol(),
                groupTemplate: null,
                iconTemplate: null,
                items: [],
                label: "",
                separator: true,
                shortcutTemplate: null,
                textTemplate: null,
                uid: ""
            }
        ];
    }
}
