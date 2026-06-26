import { Directive, forwardRef } from "@angular/core";
import { PopupMenuShortcutTemplateDirective } from "../../../common/popup-menu/directives/popup-menu-shortcut-template.directive";
import {
    PopupMenuShortcutTemplateToken,
    PopupMenuTemplateOrigin
} from "../../../common/popup-menu/models/PopupMenuConfig";

@Directive({
    selector: "ng-template[monaDropdownButtonMenuItemShortcutTemplate]",
    providers: [
        {
            provide: PopupMenuShortcutTemplateToken,
            useExisting: forwardRef(() => DropdownButtonMenuItemShortcutTemplateDirective)
        }
    ]
})
export class DropdownButtonMenuItemShortcutTemplateDirective extends PopupMenuShortcutTemplateDirective {
    public override readonly origin = PopupMenuTemplateOrigin.DropdownButton;
}
