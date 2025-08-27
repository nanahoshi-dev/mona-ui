import { Directive, forwardRef } from "@angular/core";
import { PopupMenuGroupTemplateDirective } from "../../../common/popup-menu/directives/popup-menu-group-template.directive";
import {
    PopupMenuGroupTemplateToken,
    PopupMenuTemplateOrigin
} from "../../../common/popup-menu/models/PopupMenuConfig";

@Directive({
    selector: "ng-template[monaSplitButtonMenuGroupTemplate]",
    providers: [
        {
            provide: PopupMenuGroupTemplateToken,
            useExisting: forwardRef(() => SplitButtonMenuGroupTemplateDirective)
        }
    ]
})
export class SplitButtonMenuGroupTemplateDirective extends PopupMenuGroupTemplateDirective {
    public override readonly origin = PopupMenuTemplateOrigin.SplitButton;
}
