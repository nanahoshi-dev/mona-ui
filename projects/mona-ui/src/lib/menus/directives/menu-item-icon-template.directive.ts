import { Directive, forwardRef } from "@angular/core";
import { PopupMenuIconTemplateDirective } from "../../common/popup-menu/directives/popup-menu-icon-template.directive";
import { PopupMenuIconTemplateToken, PopupMenuTemplateOrigin } from "../../common/popup-menu/models/PopupMenuConfig";

@Directive({
    selector: "ng-template[monaMenuItemIconTemplate]",
    providers: [
        {
            provide: PopupMenuIconTemplateToken,
            useExisting: forwardRef(() => MenuItemIconTemplateDirective)
        }
    ]
})
export class MenuItemIconTemplateDirective extends PopupMenuIconTemplateDirective {
    public override readonly origin = PopupMenuTemplateOrigin.MenubarMenu;
}
