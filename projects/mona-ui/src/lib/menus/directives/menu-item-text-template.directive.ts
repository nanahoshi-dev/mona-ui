import { Directive, forwardRef } from "@angular/core";
import { PopupMenuTextTemplateDirective } from "../../common/popup-menu/directives/popup-menu-text-template.directive";
import { PopupMenuTemplateOrigin, PopupMenuTextTemplateToken } from "../../common/popup-menu/models/PopupMenuConfig";

@Directive({
    selector: "ng-template[monaMenuItemTextTemplate]",
    providers: [
        {
            provide: PopupMenuTextTemplateToken,
            useExisting: forwardRef(() => MenuItemTextTemplateDirective)
        }
    ]
})
export class MenuItemTextTemplateDirective extends PopupMenuTextTemplateDirective {
    public override readonly origin = PopupMenuTemplateOrigin.MenubarMenu;
}
