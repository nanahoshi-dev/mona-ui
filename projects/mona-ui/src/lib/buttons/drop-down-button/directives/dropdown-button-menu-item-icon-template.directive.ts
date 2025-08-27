import { Directive, forwardRef } from "@angular/core";
import { PopupMenuIconTemplateDirective } from "../../../common/popup-menu/directives/popup-menu-icon-template.directive";
import { PopupMenuIconTemplateToken, PopupMenuTemplateOrigin } from "../../../common/popup-menu/models/PopupMenuConfig";

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
