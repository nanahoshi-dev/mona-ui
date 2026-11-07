import { Directive, forwardRef } from "@angular/core";
import { PopupMenuTextTemplateDirective } from "@nanahoshi/mona-ui/popup-menu";
import { PopupMenuTemplateOrigin, PopupMenuTextTemplateToken } from "@nanahoshi/mona-ui/internal/popup-menu";

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
