import { Directive, forwardRef } from "@angular/core";
import {
    PopupMenuShortcutTemplateDirective,
    PopupMenuShortcutTemplateToken,
    PopupMenuTemplateOrigin
} from "@nanahoshi/mona-ui/popup-menu";

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
