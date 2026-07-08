import { Directive, forwardRef } from "@angular/core";
import {
    PopupMenuGroupTemplateDirective,
    PopupMenuGroupTemplateToken,
    PopupMenuTemplateOrigin
} from "@mirei/mona-ui/popup-menu";

@Directive({
    selector: "ng-template[monaMenuGroupTemplate]",
    providers: [
        {
            provide: PopupMenuGroupTemplateToken,
            useExisting: forwardRef(() => MenuGroupTemplateDirective)
        }
    ]
})
export class MenuGroupTemplateDirective extends PopupMenuGroupTemplateDirective {
    public override readonly origin = PopupMenuTemplateOrigin.MenubarMenu;
}
