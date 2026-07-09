import { Directive, forwardRef } from "@angular/core";
import {
    PopupMenuIconTemplateDirective,
    PopupMenuIconTemplateToken,
    PopupMenuTemplateOrigin
} from "@nanahoshi/mona-ui/popup-menu";

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
