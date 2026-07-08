import { Directive, forwardRef } from "@angular/core";
import {
    PopupMenuTemplateOrigin,
    PopupMenuTextTemplateDirective,
    PopupMenuTextTemplateToken
} from "@mirei/mona-ui/popup-menu";

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
