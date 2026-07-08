import { Directive, forwardRef } from "@angular/core";
import {
    PopupMenuShortcutTemplateDirective,
    PopupMenuShortcutTemplateToken,
    PopupMenuTemplateOrigin
} from "@mirei/mona-ui/popup-menu";

@Directive({
    selector: "ng-template[monaMenuItemShortcutTemplate]",
    providers: [
        {
            provide: PopupMenuShortcutTemplateToken,
            useExisting: forwardRef(() => MenuItemShortcutTemplateDirective)
        }
    ]
})
export class MenuItemShortcutTemplateDirective extends PopupMenuShortcutTemplateDirective {
    public override readonly origin = PopupMenuTemplateOrigin.MenubarMenu;
}
