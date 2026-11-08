import { Directive, forwardRef } from "@angular/core";
import { PopupMenuIconTemplateDirective } from "@nanahoshi/mona-ui/popup-menu";
import { PopupMenuIconTemplateToken, PopupMenuTemplateOrigin } from "@nanahoshi/mona-ui/internal/popup-menu";

@Directive({
    selector: "ng-template[monaSplitButtonMenuItemIconTemplate]",
    providers: [
        {
            provide: PopupMenuIconTemplateToken,
            useExisting: forwardRef(() => SplitButtonMenuItemIconTemplateDirective)
        }
    ]
})
export class SplitButtonMenuItemIconTemplateDirective extends PopupMenuIconTemplateDirective {
    public override readonly origin = PopupMenuTemplateOrigin.SplitButton;
}
