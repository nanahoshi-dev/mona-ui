import { Directive, forwardRef } from "@angular/core";
import {
    PopupMenuTemplateOrigin,
    PopupMenuTextTemplateDirective,
    PopupMenuTextTemplateToken
} from "@mirei/mona-ui/popup-menu";

@Directive({
    selector: "ng-template[monaDropdownButtonMenuItemTextTemplate]",
    providers: [
        {
            provide: PopupMenuTextTemplateToken,
            useExisting: forwardRef(() => DropdownButtonMenuItemTextTemplateDirective)
        }
    ]
})
export class DropdownButtonMenuItemTextTemplateDirective extends PopupMenuTextTemplateDirective {
    public override readonly origin = PopupMenuTemplateOrigin.DropdownButton;
}
