import { Directive, forwardRef } from "@angular/core";
import { PopupMenuIconTemplateDirective } from "../../../common/popup-menu/directives/popup-menu-icon-template.directive";
import { PopupMenuIconTemplateToken, PopupMenuTemplateOrigin } from "../../../common/popup-menu/models/PopupMenuConfig";

@Directive({
    selector: "ng-template[monaContextMenuIconTemplate]",
    providers: [
        {
            provide: PopupMenuIconTemplateToken,
            useExisting: forwardRef(() => ContextMenuIconTemplateDirective)
        }
    ]
})
export class ContextMenuIconTemplateDirective extends PopupMenuIconTemplateDirective {
    public override readonly origin = PopupMenuTemplateOrigin.ContextMenu;
}
