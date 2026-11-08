import { Directive, forwardRef } from "@angular/core";
import { PopupMenuShortcutTemplateDirective } from "@nanahoshi/mona-ui/popup-menu";
import { PopupMenuShortcutTemplateToken, PopupMenuTemplateOrigin } from "@nanahoshi/mona-ui/internal/popup-menu";

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
