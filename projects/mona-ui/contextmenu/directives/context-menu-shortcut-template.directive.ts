import { Directive, forwardRef } from "@angular/core";
import {
    PopupMenuShortcutTemplateDirective,
    PopupMenuShortcutTemplateToken,
    PopupMenuTemplateOrigin
} from "@mirei/mona-ui/popup-menu";

@Directive({
    selector: "ng-template[monaContextMenuShortcutTemplate]",
    providers: [
        {
            provide: PopupMenuShortcutTemplateToken,
            useExisting: forwardRef(() => ContextMenuShortcutTemplateDirective)
        }
    ]
})
export class ContextMenuShortcutTemplateDirective extends PopupMenuShortcutTemplateDirective {
    public override readonly origin = PopupMenuTemplateOrigin.ContextMenu;
}
