import { Directive, forwardRef } from "@angular/core";
import { PopupMenuIconTemplateDirective } from "@nanahoshi/mona-ui/popup-menu";
import { PopupMenuIconTemplateToken, PopupMenuTemplateOrigin } from "@nanahoshi/mona-ui/internal/popup-menu";

@Directive({
    selector: "ng-template[monaContextMenuIconTemplate]",
    providers: [
        {
            provide: PopupMenuIconTemplateToken,
            useExisting: forwardRef(() => ContextMenuIconTemplateDirective)
        }
    ]
})
export class ContextMenuIconTemplateDirective extends PopupMenuIconTemplateDirective {
    public override readonly origin = PopupMenuTemplateOrigin.ContextMenu;
}
