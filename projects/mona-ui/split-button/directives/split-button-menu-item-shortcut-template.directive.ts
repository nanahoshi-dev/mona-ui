import { Directive, forwardRef } from "@angular/core";
import { PopupMenuShortcutTemplateDirective } from "@nanahoshi/mona-ui/popup-menu";
import { PopupMenuShortcutTemplateToken, PopupMenuTemplateOrigin } from "@nanahoshi/mona-ui/internal/popup-menu";

@Directive({
    selector: "ng-template[monaSplitButtonMenuItemShortcutTemplate]",
    providers: [
        {
            provide: PopupMenuShortcutTemplateToken,
            useExisting: forwardRef(() => SplitButtonMenuItemShortcutTemplateDirective)
        }
    ]
})
export class SplitButtonMenuItemShortcutTemplateDirective extends PopupMenuShortcutTemplateDirective {
    public override readonly origin = PopupMenuTemplateOrigin.SplitButton;
}
