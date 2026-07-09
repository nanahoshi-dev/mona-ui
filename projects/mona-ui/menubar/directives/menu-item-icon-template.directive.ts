import { Directive, forwardRef } from "@angular/core";
import {
    PopupMenuIconTemplateDirective,
    PopupMenuIconTemplateToken,
    PopupMenuTemplateOrigin
} from "@nanahoshi/mona-ui/popup-menu";

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
