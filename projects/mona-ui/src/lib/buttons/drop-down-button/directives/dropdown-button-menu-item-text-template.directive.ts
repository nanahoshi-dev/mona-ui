import { Directive, forwardRef } from "@angular/core";
import { PopupMenuTextTemplateDirective } from "../../../common/popup-menu/directives/popup-menu-text-template.directive";
import { PopupMenuTemplateOrigin, PopupMenuTextTemplateToken } from "../../../common/popup-menu/models/PopupMenuConfig";

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
