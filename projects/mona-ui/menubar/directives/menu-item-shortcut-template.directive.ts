import { Directive, forwardRef } from "@angular/core";
import { PopupMenuShortcutTemplateDirective } from "@nanahoshi/mona-ui/popup-menu";
import { PopupMenuShortcutTemplateToken, PopupMenuTemplateOrigin } from "@nanahoshi/mona-ui/internal/popup-menu";

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
