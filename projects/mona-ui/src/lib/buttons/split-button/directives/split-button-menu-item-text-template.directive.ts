import { Directive, forwardRef } from "@angular/core";
import { PopupMenuTextTemplateDirective } from "../../../common/popup-menu/directives/popup-menu-text-template.directive";
import { PopupMenuTemplateOrigin, PopupMenuTextTemplateToken } from "../../../common/popup-menu/models/PopupMenuConfig";

@Directive({
    selector: "ng-template[monaSplitButtonMenuItemTextTemplate]",
    providers: [
        {
            provide: PopupMenuTextTemplateToken,
            useExisting: forwardRef(() => SplitButtonMenuItemTextTemplateDirective)
        }
    ]
})
export class SplitButtonMenuItemTextTemplateDirective extends PopupMenuTextTemplateDirective {
    public override readonly origin = PopupMenuTemplateOrigin.SplitButton;
}
