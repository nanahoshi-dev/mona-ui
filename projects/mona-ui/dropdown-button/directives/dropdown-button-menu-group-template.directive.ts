import { Directive, forwardRef } from "@angular/core";
import { PopupMenuGroupTemplateDirective } from "@nanahoshi/mona-ui/popup-menu";
import { PopupMenuGroupTemplateToken, PopupMenuTemplateOrigin } from "@nanahoshi/mona-ui/internal/popup-menu";

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
