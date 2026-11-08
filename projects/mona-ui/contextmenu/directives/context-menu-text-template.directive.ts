import { Directive, forwardRef } from "@angular/core";
import { PopupMenuTextTemplateDirective } from "@nanahoshi/mona-ui/popup-menu";
import { PopupMenuTemplateOrigin, PopupMenuTextTemplateToken } from "@nanahoshi/mona-ui/internal/popup-menu";

@Directive({
    selector: "ng-template[monaContextMenuTextTemplate]",
    providers: [
        {
            provide: PopupMenuTextTemplateToken,
            useExisting: forwardRef(() => ContextMenuTextTemplateDirective)
        }
    ]
})
export class ContextMenuTextTemplateDirective extends PopupMenuTextTemplateDirective {
    public override readonly origin = PopupMenuTemplateOrigin.ContextMenu;
}
