import { Directive, forwardRef } from "@angular/core";
import { PopupMenuIconTemplateDirective } from "@nanahoshi/mona-ui/popup-menu";
import { PopupMenuIconTemplateToken, PopupMenuTemplateOrigin } from "@nanahoshi/mona-ui/internal/popup-menu";

@Directive({
    selector: "ng-template[monaDropdownButtonMenuItemIconTemplate]",
    providers: [
        {
            provide: PopupMenuIconTemplateToken,
            useExisting: forwardRef(() => DropdownButtonMenuItemIconTemplateDirective)
        }
    ]
})
export class DropdownButtonMenuItemIconTemplateDirective extends PopupMenuIconTemplateDirective {
    public override readonly origin = PopupMenuTemplateOrigin.DropdownButton;
}
