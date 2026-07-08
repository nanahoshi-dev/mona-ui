import { Directive, forwardRef } from "@angular/core";
import {
    PopupMenuGroupTemplateDirective,
    PopupMenuGroupTemplateToken,
    PopupMenuTemplateOrigin
} from "@mirei/mona-ui/popup-menu";

@Directive({
    selector: "ng-template[monaDropdownButtonMenuGroupTemplate]",
    providers: [
        {
            provide: PopupMenuGroupTemplateToken,
            useExisting: forwardRef(() => DropdownButtonMenuGroupTemplateDirective)
        }
    ]
})
export class DropdownButtonMenuGroupTemplateDirective extends PopupMenuGroupTemplateDirective {
    public override readonly origin = PopupMenuTemplateOrigin.DropdownButton;
}
