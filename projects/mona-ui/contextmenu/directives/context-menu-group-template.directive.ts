import { Directive, forwardRef } from "@angular/core";
import {
    PopupMenuGroupTemplateDirective,
    PopupMenuGroupTemplateToken,
    PopupMenuTemplateOrigin
} from "@mirei/mona-ui/popup-menu";

@Directive({
    selector: "ng-template[monaContextMenuGroupTemplate]",
    providers: [
        {
            provide: PopupMenuGroupTemplateToken,
            useExisting: forwardRef(() => ContextMenuGroupTemplateDirective)
        }
    ]
})
export class ContextMenuGroupTemplateDirective extends PopupMenuGroupTemplateDirective {
    public override readonly origin = PopupMenuTemplateOrigin.ContextMenu;
}
