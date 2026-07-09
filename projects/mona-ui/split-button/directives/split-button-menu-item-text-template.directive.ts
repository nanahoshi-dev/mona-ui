import { Directive, forwardRef } from "@angular/core";
import {
    PopupMenuTemplateOrigin,
    PopupMenuTextTemplateDirective,
    PopupMenuTextTemplateToken
} from "@nanahoshi/mona-ui/popup-menu";

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
