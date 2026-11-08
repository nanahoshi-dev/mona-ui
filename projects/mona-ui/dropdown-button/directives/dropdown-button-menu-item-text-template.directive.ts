import { Directive, forwardRef } from "@angular/core";
import { PopupMenuTextTemplateDirective } from "@nanahoshi/mona-ui/popup-menu";
import { PopupMenuTemplateOrigin, PopupMenuTextTemplateToken } from "@nanahoshi/mona-ui/internal/popup-menu";

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
